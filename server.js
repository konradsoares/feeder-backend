const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Replace with Railway-provided URI in production
const mongoUri = process.env.MONGO_URI || "mongodb://mongo:elyUqREAoxfkAdduKaEgEGdlDGRVYBwH@yamabiko.proxy.rlwy.net:21817";

mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

const scheduleSchema = new mongoose.Schema({
  hour: Number,
  minute: Number,
  action: String // "open" or "close"
});

const Schedule = mongoose.model("Schedule", scheduleSchema);

// Add new schedule
app.post("/api/schedule", async (req, res) => {
  const { hour, minute, action } = req.body;
  const doc = new Schedule({ hour, minute, action });
  await doc.save();
  res.json({ message: "Scheduled" });
});

// Get current action based on hour/minute
app.get("/api/check", async (req, res) => {
  const { hour, minute } = req.query;
  const match = await Schedule.findOne({ hour: parseInt(hour), minute: parseInt(minute) });
  res.json({ action: match ? match.action : "none" });
});

app.get("/", (_, res) => res.send("Feeder API running."));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));

