import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import { adminAuth, db } from "./firebase-admin";

const app = express();
const PORT = process.env.PORT || 3000;

const ALLOWED_DOMAIN = "bayzat.com";
const SESSION_EXPIRES_IN = 5 * 24 * 60 * 60 * 1000; // 5 days

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

app.post("/api/logout", (_req, res) => {
  res.clearCookie("session", { path: "/" });
  res.json({ status: "ok" });
});

// ── Page Routes ──

// Public pages — no auth required
app.get("/pages/public/:slug", (req, res) => {
  const filePath = path.join(__dirname, "../content/public", `${req.params.slug}.html`);
  res.sendFile(filePath, (err) => {
    if (err) res.status(404).send("Page not found");
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
      res.status(403).sendFile(path.join(__dirname, "../public/403.html"));
      return;
    }

    const filePath = path.join(__dirname, "../content/internal", `${req.params.slug}.html`);
    res.sendFile(filePath, (err) => {
      if (err) res.status(404).send("Page not found");
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
      res.status(403).sendFile(path.join(__dirname, "../public/403.html"));
      return;
    }

    const filePath = path.join(__dirname, "../content/private", `${req.params.slug}.html`);
    res.sendFile(filePath, (err) => {
      if (err) res.status(404).send("Page not found");
    });
  } catch {
    res.redirect(`/?redirect=${encodeURIComponent(req.originalUrl)}`);
  }
});

// Dashboard — internal only
app.get("/dashboard", async (req, res) => {
  const session = req.cookies.session;
  if (!session) {
    res.redirect(`/?redirect=${encodeURIComponent(req.originalUrl)}`);
    return;
  }

  try {
    const decoded = await getUserFromSession(session);
    if (!decoded.email || !decoded.email.endsWith("@" + ALLOWED_DOMAIN)) {
      res.status(403).sendFile(path.join(__dirname, "../public/403.html"));
      return;
    }

    const filePath = path.join(__dirname, "../content/internal/dashboard.html");
    res.sendFile(filePath, (err) => {
      if (err) res.status(404).send("Page not found");
    });
  } catch {
    res.redirect(`/?redirect=${encodeURIComponent(req.originalUrl)}`);
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
