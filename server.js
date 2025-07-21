const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const Schedule = require('./models/Schedule');

// In-memory state (this would reset on restart)
let autoMode = true;
let feederOpen = false;
let currentTime = 'Unknown';

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// === API ENDPOINTS ===

// GET all scheduled times
app.get('/api/schedules', async (req, res) => {
  try {
    const schedules = await Schedule.find();
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/time', (req, res) => {
  const now = new Date();
  
  // Convert to Dublin time
  const options = { timeZone: 'Europe/Dublin', hour12: false };
  const formatter = new Intl.DateTimeFormat('en-GB', {
    ...options,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const parts = formatter.formatToParts(now);
  const timeObj = Object.fromEntries(parts.map(p => [p.type, p.value]));

  res.json({
    hour: parseInt(timeObj.hour),
    minute: parseInt(timeObj.minute),
    second: parseInt(timeObj.second),
  });
});
// POST new schedule
app.post('/api/schedules', async (req, res) => {
  try {
    const newSchedule = new Schedule(req.body);
    await newSchedule.save();
    res.status(201).json(newSchedule);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/manual', (req, res) => {
  if (!autoMode) {
    manualTrigger = true;
    res.json({ message: 'Manual trigger activated' });
  } else {
    res.status(403).json({ error: 'Manual control disabled in AUTO mode' });
  }
});

// DELETE schedule by ID
app.delete('/api/schedules/:id', async (req, res) => {
  try {
    await Schedule.findByIdAndDelete(req.params.id);
    res.json({ message: 'Schedule deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

let manualTrigger = false; // ← Add this above if not declared
app.get('/api/status', async (req, res) => {
  try {
    const schedules = await Schedule.find(); // ← add this
    res.json({
      time: currentTime,
      mode: autoMode ? 'auto' : 'manual',
      feeder: feederOpen ? 'open' : 'closed',
      schedules, // ← include this
      manualTrigger: feederOpen && !autoMode // ← optional
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

// Toggle between auto and manual mode
app.post('/api/mode', (req, res) => {
  autoMode = !autoMode;
  res.json({ mode: autoMode ? 'auto' : 'manual' });
});

// Manually trigger feeder open/close
app.post('/api/manual', (req, res) => {
  if (!autoMode) {
    feederOpen = !feederOpen;
    res.json({ message: `Feeder ${feederOpen ? 'opened' : 'closed'}` });
  } else {
    res.status(403).json({ error: 'Manual control disabled in AUTO mode' });
  }
});

// Server start
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Feeder API running on port ${PORT}`);
});
