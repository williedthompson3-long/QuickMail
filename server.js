const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs-extra");
const path = require("path");

const app = express();
const PORT = 3000;
const dbPath = path.join(__dirname, "db", "deliveries.json");

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

if (!fs.existsSync(dbPath)) fs.writeJsonSync(dbPath, []);

// 📦 POST /api/book — Create new delivery
app.post("/api/book", async (req, res) => {
  const { sender, receiver, pickup, destination, packageDetails } = req.body;

  if (!sender || !receiver || !pickup || !destination) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const deliveries = await fs.readJson(dbPath);
  const trackingNumber = "TRK-" + Date.now().toString().slice(-6);
  const newDelivery = {
    trackingNumber,
    sender,
    receiver,
    pickup,
    destination,
    packageDetails,
    status: "Pending Pickup",
    createdAt: new Date().toISOString()
  };
  deliveries.push(newDelivery);
  await fs.writeJson(dbPath, deliveries);
  res.json({ success: true, trackingNumber });
});

// 🔍 GET /api/track/:id — Track a delivery
app.get("/api/track/:id", async (req, res) => {
  const deliveries = await fs.readJson(dbPath);
  const found = deliveries.find(d => d.trackingNumber === req.params.id);
  if (!found) return res.status(404).json({ error: "Not found" });
  res.json(found);
});

// 🚚 PUT /api/update/:id — Update delivery status (admin use)
app.put("/api/update/:id", async (req, res) => {
  const { status } = req.body;
  const deliveries = await fs.readJson(dbPath);
  const idx = deliveries.findIndex(d => d.trackingNumber === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  deliveries[idx].status = status || deliveries[idx].status;
  await fs.writeJson(dbPath, deliveries);
  res.json({ success: true, updated: deliveries[idx] });
});
// GET /api/all — returns all deliveries (admin use)
app.get("/api/all", async (req, res) => {
  const deliveries = await fs.readJson(dbPath);
  res.json(deliveries);
});
// Simple hardcoded admin credentials
const ADMIN_USER = "admin";
const ADMIN_PASS = "password123";

// POST /api/admin-login
app.post("/api/admin-login", (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: "Invalid credentials" });
  }
});

// Existing routes here
app.post('/api/book', async (req, res) => {
  // booking logic
});

app.get('/api/track/:id', async (req, res) => {
  // tracking logic
});


// 🆕 ADMIN ROUTES — paste below this comment
// Get all deliveries
app.get('/api/deliveries', async (req, res) => {
  try {
    const data = await fs.readJson('./db/deliveries.json');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load deliveries' });
  }
});

// Update all deliveries
app.post('/api/update-deliveries', async (req, res) => {
  try {
    await fs.writeJson('./db/deliveries.json', req.body, { spaces: 2 });
    res.json({ message: 'Deliveries updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save deliveries' });
  }
});

// Delete one delivery
app.delete('/api/delete-delivery/:id', async (req, res) => {
  try {
    const data = await fs.readJson('./db/deliveries.json');
    const filtered = data.filter(d => d.id !== req.params.id);
    await fs.writeJson('./db/deliveries.json', filtered, { spaces: 2 });
    res.json({ message: 'Delivery deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});