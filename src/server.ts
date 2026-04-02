import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import { adminAuth, db } from "./firebase-admin";

const app = express();
const PORT = process.env.PORT || 3000;

// Used for internal pages
const ALLOWED_DOMAIN = "bayzat.com";

const ADMIN_EMAILS = ["abdulrahman.emad@bayzat.com"];
const SESSION_EXPIRES_IN = 5 * 24 * 60 * 60 * 1000; // 5 days

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));

app.use(express.static(path.join(__dirname, "../public")));
app.use(express.json());
app.use(cookieParser());

// Redirect logged-in users away from the login page
app.get("/", async (req, res, next) => {
  const session = req.cookies.session;
  if (!session) return next();

  // When user is redirected to home page after sign in
  /*
    1. User tries to access /private/some-page
    2. User isn't authenticated (user is redirected to /?redirect=page-name)
    3. Auth page (index) is displayed
    4. User log in successfully and redirected back to /private/some-page
  */
  try {
    await getUserFromSession(session);
    const redirect = req.query.redirect;
    const isSafe =
      typeof redirect === "string" &&
      redirect.startsWith("/") &&
      !redirect.startsWith("//");

    res.redirect(isSafe ? redirect : "/dashboard");
  } catch {
    next();
  }
});

// Serve login page for unauthenticated users
app.get("/", (_req, res) => {
  res.render("index");
});

// ── Helper: get user from session cookie ──

async function getUserFromSession(sessionCookie: string) {
  const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
  return decoded;
}

// ── Auth Routes ──

app.post("/api/login", async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    res.status(400).json({ error: "Missing idToken" });
    return;
  }

  try {
    // Ensure the token isn't fake, and it's made by firebase
    await adminAuth.verifyIdToken(idToken);

    // Create a longer session (5 days instead of 1 hour)
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_EXPIRES_IN,
    });

    res.cookie("session", sessionCookie, {
      maxAge: SESSION_EXPIRES_IN,
      httpOnly: true, // to prevent the token from access in JS (XSS - XSRF attacks)
      secure: process.env.NODE_ENV === "production", // Only over HTTPS (encryped network)
      sameSite: "lax", // prevent sites from making POST requests on behalf of user with his cookie (CSRF attack)
      path: "/",
    });

    res.json({ status: "ok" });
  } catch (error) {
    console.error(
      "Login error:",
      error instanceof Error ? error.message : error,
    );
    const message =
      error instanceof Error && error.message.includes("expired")
        ? "Your sign-in has expired. Please try again."
        : "Unable to verify your identity. Please sign in again.";
    res.status(401).json({ error: message });
  }
});

app.get("/api/me", async (req, res) => {
  const session = req.cookies.session;
  if (!session) {
    res.json({ authenticated: false });
    return;
  }

  try {
    const decoded = await getUserFromSession(session);
    const email = decoded.email || null;
    const isEmployee = !!email && email.endsWith("@" + ALLOWED_DOMAIN);
    const isAdmin = !!email && ADMIN_EMAILS.includes(email);
    res.json({ authenticated: true, email, isEmployee, isAdmin });
  } catch {
    res.json({ authenticated: false });
  }
});

// Admin: list all page access entries
app.get("/api/admin/page-access", async (req, res) => {
  const session = req.cookies.session;
  if (!session) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const decoded = await getUserFromSession(session);
    if (!decoded.email || !ADMIN_EMAILS.includes(decoded.email)) {
      res.status(403).json({ error: "Not authorized" });
      return;
    }

    const snapshot = await db.collection("pageAccess").get();
    const entries: {
      slug: string;
      accessType: string;
      allowedEmails: string[];
    }[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      entries.push({
        slug: doc.id,
        accessType: data.accessType || "client",
        allowedEmails: data.allowedEmails || [],
      });
    });
    res.json(entries);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// Admin: grant or revoke email access to a page
app.post("/api/admin/page-access", async (req, res) => {
  const session = req.cookies.session;
  if (!session) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const decoded = await getUserFromSession(session);
    if (!decoded.email || !ADMIN_EMAILS.includes(decoded.email)) {
      res.status(403).json({ error: "Not authorized" });
      return;
    }

    const { slug, email, accessType, action } = req.body;
    if (!slug || !["grant", "revoke"].includes(action)) {
      res.status(400).json({ error: "Missing slug or action (grant/revoke)" });
      return;
    }

    const docRef = db.collection("pageAccess").doc(slug);

    if (action === "grant") {
      if (!accessType || !["client", "internal"].includes(accessType)) {
        res
          .status(400)
          .json({ error: "Missing or invalid accessType (client/internal)" });
        return;
      }

      if (accessType === "internal") {
        await docRef.set({ accessType: "internal", allowedEmails: [] });
      } else {
        if (!email) {
          res
            .status(400)
            .json({ error: "Email is required for client access" });
          return;
        }
        const doc = await docRef.get();
        const existing = doc.exists ? doc.data()?.allowedEmails || [] : [];
        if (!existing.includes(email)) existing.push(email);
        await docRef.set({ accessType: "client", allowedEmails: existing });
      }
    } else {
      // Revoke: if email is provided, remove that email; otherwise remove the whole entry
      if (email) {
        const doc = await docRef.get();
        let allowedEmails: string[] = doc.exists
          ? doc.data()?.allowedEmails || []
          : [];
        allowedEmails = allowedEmails.filter((e: string) => e !== email);
        await docRef.set({ accessType: "client", allowedEmails });
      } else {
        await docRef.delete();
      }
    }

    const updated = await docRef.get();
    res.json({
      slug,
      ...(updated.exists
        ? updated.data()
        : { accessType: null, allowedEmails: [] }),
    });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/logout", (_req, res) => {
  res.clearCookie("session", { path: "/" });
  res.json({ status: "ok" });
});

// ── Page Routes ──
// Internal pages — @bayzat.com only
app.get("/pages/internal/:slug", async (req, res) => {
  const session = req.cookies.session;
  if (!session) {
    res.redirect(`/?redirect=${encodeURIComponent(req.originalUrl)}`);
    return;
  }

  try {
    const decoded = await getUserFromSession(session);
    if (!decoded.email || !decoded.email.endsWith("@" + ALLOWED_DOMAIN)) {
      res.status(403).render("403");
      return;
    }

    res.render(
      `pages/internal/${req.params.slug}`,
      (err: Error | null, html: string) => {
        if (err) res.status(404).send("Page not found");
        else res.send(html);
      },
    );
  } catch {
    res.redirect(`/?redirect=${encodeURIComponent(req.originalUrl)}`);
  }
});

// Private pages — per-user access via Firestore
app.get("/pages/private/:slug", async (req, res) => {
  const session = req.cookies.session;
  if (!session) {
    res.redirect(`/?redirect=${encodeURIComponent(req.originalUrl)}`);
    return;
  }

  try {
    const decoded = await getUserFromSession(session);
    if (!decoded.email) {
      res.redirect(`/?redirect=${encodeURIComponent(req.originalUrl)}`);
      return;
    }

    const doc = await db.collection("pageAccess").doc(req.params.slug).get();

    if (!doc.exists) {
      res.status(404).send("Page not found");
      return;
    }

    const data = doc.data();
    const accessType = data?.accessType || "client";
    const allowed =
      accessType === "internal"
        ? decoded.email.endsWith("@" + ALLOWED_DOMAIN)
        : (data?.allowedEmails || []).includes(decoded.email);

    if (!allowed) {
      res.status(403).render("403");
      return;
    }

    res.render(
      `pages/private/${req.params.slug}`,
      (err: Error | null, html: string) => {
        if (err) res.status(404).send("Page not found");
        else res.send(html);
      },
    );
  } catch {
    res.redirect(`/?redirect=${encodeURIComponent(req.originalUrl)}`);
  }
});

// Dashboard
app.get("/dashboard", async (req, res) => {
  const session = req.cookies.session;
  let user = {
    authenticated: false,
    email: null as string | null,
    isEmployee: false,
    isAdmin: false,
  };

  if (session) {
    try {
      const decoded = await getUserFromSession(session);
      const email = decoded.email || null;
      user = {
        authenticated: true,
        email,
        isEmployee: !!email && email.endsWith("@" + ALLOWED_DOMAIN),
        isAdmin: !!email && ADMIN_EMAILS.includes(email),
      };
    } catch {}
  }

  let accessEntries: {
    slug: string;
    accessType: string;
    allowedEmails: string[];
  }[] = [];
  if (user.isAdmin) {
    try {
      const snapshot = await db.collection("pageAccess").get();
      snapshot.forEach((doc) => {
        const data = doc.data();
        accessEntries.push({
          slug: doc.id,
          accessType: data.accessType || "client",
          allowedEmails: data.allowedEmails || [],
        });
      });
    } catch {}
  }

  res.render("pages/internal/dashboard", { user, accessEntries });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
