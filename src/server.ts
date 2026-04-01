import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import { adminAuth, db } from "./firebase-admin";

const app = express();
const PORT = process.env.PORT || 3000;

const ALLOWED_DOMAIN = "bayzat.com";
const ADMIN_EMAILS = ["abdulrahman.emad@bayzat.com"];
const SESSION_EXPIRES_IN = 5 * 24 * 60 * 60 * 1000; // 5 days

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));

app.use(express.json());
app.use(cookieParser());

// Redirect logged-in users away from the login page
app.get("/", async (req, res, next) => {
  const session = req.cookies.session;
  if (!session) return next();

  try {
    await getUserFromSession(session);
    const redirect = req.query.redirect;
    res.redirect(typeof redirect === "string" && redirect.startsWith("/") ? redirect : "/dashboard");
  } catch {
    next();
  }
});

// Serve login page for unauthenticated users
app.get("/", (_req, res) => {
  res.render("index");
});

app.use(express.static(path.join(__dirname, "../public")));

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
    await adminAuth.verifyIdToken(idToken);

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_EXPIRES_IN,
    });

    res.cookie("session", sessionCookie, {
      maxAge: SESSION_EXPIRES_IN,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    res.json({ status: "ok" });
  } catch (error) {
    console.error("Login error:", error instanceof Error ? error.message : error);
    res.status(401).json({ error: "Invalid token" });
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
  if (!session) { res.status(401).json({ error: "Not authenticated" }); return; }

  try {
    const decoded = await getUserFromSession(session);
    if (!decoded.email || !ADMIN_EMAILS.includes(decoded.email)) {
      res.status(403).json({ error: "Not authorized" });
      return;
    }

    const snapshot = await db.collection("pageAccess").get();
    const entries: { slug: string; allowedEmails: string[] }[] = [];
    snapshot.forEach((doc) => {
      entries.push({ slug: doc.id, allowedEmails: doc.data().allowedEmails || [] });
    });
    res.json(entries);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// Admin: grant or revoke email access to a page
app.post("/api/admin/page-access", async (req, res) => {
  const session = req.cookies.session;
  if (!session) { res.status(401).json({ error: "Not authenticated" }); return; }

  try {
    const decoded = await getUserFromSession(session);
    if (!decoded.email || !ADMIN_EMAILS.includes(decoded.email)) {
      res.status(403).json({ error: "Not authorized" });
      return;
    }

    const { slug, email, action } = req.body;
    if (!slug || !email || !["grant", "revoke"].includes(action)) {
      res.status(400).json({ error: "Missing slug, email, or action (grant/revoke)" });
      return;
    }

    const docRef = db.collection("pageAccess").doc(slug);
    const doc = await docRef.get();
    let allowedEmails: string[] = doc.exists ? (doc.data()?.allowedEmails || []) : [];

    if (action === "grant" && !allowedEmails.includes(email)) {
      allowedEmails.push(email);
    } else if (action === "revoke") {
      allowedEmails = allowedEmails.filter((e: string) => e !== email);
    }

    await docRef.set({ allowedEmails }, { merge: true });
    res.json({ slug, allowedEmails });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/logout", (_req, res) => {
  res.clearCookie("session", { path: "/" });
  res.json({ status: "ok" });
});

// ── Page Routes ──

// Public pages — no auth required
app.get("/pages/public/:slug", (req, res) => {
  res.render(`pages/public/${req.params.slug}`, (err: Error | null, html: string) => {
    if (err) res.status(404).send("Page not found");
    else res.send(html);
  });
});

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

    res.render(`pages/internal/${req.params.slug}`, (err: Error | null, html: string) => {
      if (err) res.status(404).send("Page not found");
      else res.send(html);
    });
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

    // Check Firestore for access: pageAccess/{slug} has an `allowedEmails` array
    const doc = await db.collection("pageAccess").doc(req.params.slug).get();

    if (!doc.exists) {
      res.status(404).send("Page not found");
      return;
    }

    const data = doc.data();
    const allowedEmails: string[] = data?.allowedEmails || [];

    if (!allowedEmails.includes(decoded.email)) {
      res.status(403).render("403");
      return;
    }

    res.render(`pages/private/${req.params.slug}`, (err: Error | null, html: string) => {
      if (err) res.status(404).send("Page not found");
      else res.send(html);
    });
  } catch {
    res.redirect(`/?redirect=${encodeURIComponent(req.originalUrl)}`);
  }
});

// Dashboard
app.get("/dashboard", async (req, res) => {
  const session = req.cookies.session;
  let user = { authenticated: false, email: null as string | null, isEmployee: false, isAdmin: false };

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

  let accessEntries: { slug: string; allowedEmails: string[] }[] = [];
  if (user.isAdmin) {
    try {
      const snapshot = await db.collection("pageAccess").get();
      snapshot.forEach((doc) => {
        accessEntries.push({ slug: doc.id, allowedEmails: doc.data().allowedEmails || [] });
      });
    } catch {}
  }

  res.render("pages/internal/dashboard", { user, accessEntries });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
