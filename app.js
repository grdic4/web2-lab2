const express = require("express");
const app = express();
app.set("view engine", "pug");
const sanitizeHtml = require("sanitize-html");
app.use(express.static("public"));

const { Pool } = require("pg");
require("dotenv").config();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});
const toggles = {
  xssEnabled: false,
  brokenAccessEnabled: false,
};

app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.locals.toggles = toggles;
  next();
});

app.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, author, content, created_at FROM comments ORDER BY created_at DESC"
    );
    res.render("index", { comments: rows, toggles });
  } catch (err) {
    console.error(err);
    res.status(500).send("DB error");
  }
});

app.post("/toggle", (req, res) => {
  const { key, value } = req.body || {};

  if (!key) return res.status(400).json({ ok: false, message: "missing key" });
  if (typeof toggles[key] === "undefined") {
    return res.status(400).json({ ok: false, message: "Nepoznata vrijednos" });
  }
  const newVal = value === "true" || value === true || value === "on";
  toggles[key] = newVal;
  console.log("Toggles: ", toggles);
  return res.json({ ok: true, toggles });
});

app.post("/comment", async (req, res) => {
  let author = req.body.author ? String(req.body.author).trim() : "anon";
  let content = req.body.content ? String(req.body.content) : "";

  try {
    if (!toggles.xssEnabled) {
      author = sanitizeHtml(author, { allowedTags: [], allowedAttributes: {} });
      content = sanitizeHtml(content, {
        allowedTags: [],
        allowedAttributes: {},
      });
    }
    await pool.query("INSERT INTO comments (author, content) VALUES ($1, $2)", [
      author,
      content,
    ]);
    return res.redirect("/");
  } catch (err) {
    console.error(err);
    return res.status(500).send("DB insert error");
  }
});

app.delete("/admin/delete-all", async (req, res) => {
  if (!toggles.brokenAccessEnabled) {
    const isAdmin = !!(
      req.session &&
      req.session.user &&
      req.session.user.role === "admin"
    );
    if (!isAdmin) {
      return res.status(403).json({ error: "Ti nisi admin" });
    }
  }
  await pool.query("DELETE FROM comments");
  return res.json({ ok: true, message: "Svi podaci obrisani." });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`App listening on http://localhost:${PORT}`);
});
