const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const Schedule = require('./models/Schedule');

// In-memory state (resets on restart)
let autoMode = true;
let manualTrigger = false;

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

/* === API ENDPOINTS === */

// GET all scheduled times
app.get('/api/schedules', async (req, res) => {
  try {
    const schedules = await Schedule.find();
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Dublin time
app.get('/api/time', (req, res) => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Dublin',
    hour12: false,
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

// POST a new schedule
app.post('/api/schedules', async (req, res) => {
  try {
    const newSchedule = new Schedule(req.body);
    await newSchedule.save();
    res.status(201).json(newSchedule);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE a schedule
app.delete('/api/schedules/:id', async (req, res) => {
  try {
    await Schedule.findByIdAndDelete(req.params.id);
    res.json({ message: 'Schedule deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET system status
app.get('/api/status', async (req, res) => {
  try {
    const schedules = await Schedule.find();
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Dublin',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });

    const parts = formatter.formatToParts(now);
    const timeObj = Object.fromEntries(parts.map(p => [p.type, p.value]));
    const time = `${timeObj.hour}:${timeObj.minute}`;

    res.json({
      time,
      mode: autoMode ? 'auto' : 'manual',
      feeder: manualTrigger ? 'open' : 'closed', // Optional, reflect active trigger
      schedules,
      manualTrigger
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

// Toggle auto/manual mode
app.post('/api/mode', (req, res) => {
  autoMode = !autoMode;
  res.json({ mode: autoMode ? 'auto' : 'manual' });
});

// Trigger feeder manually
app.post('/api/manual', (req, res) => {
  if (!autoMode) {
    feederOpen = !feederOpen;  // toggle state
    manualTrigger = true;
    res.json({ message: `Feeder ${feederOpen ? 'opened' : 'closed'}` });
  } else {
    res.status(403).json({ error: 'Manual control disabled in AUTO mode' });
  }
});


// Reset manual trigger (called by ESP after using it)
app.post('/api/manual/reset', (req, res) => {
  manualTrigger = false;
  res.json({ message: 'Manual trigger reset' });
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Feeder API running on port ${PORT}`);
});
