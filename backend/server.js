// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); // parse JSON bodies

// Environment variables
const MONGODB_URI = process.env.MONGODB_URI || '';
const PORT = process.env.PORT || 5000;

// Simple health-check
app.get('/', (req, res) => res.send({ status: 'ok', env: process.env.NODE_ENV || 'dev' }));

// Mongoose model
const taskSchema = new mongoose.Schema({
  text: { type: String, required: true },
  completed: { type: Boolean, default: false },
  createdAt: { type: Number, default: Date.now },
  dueDate: { type: String, default: null },
  priority: { type: String, enum: ['high','medium','low'], default: 'medium' }
}, { versionKey: false });

const Task = mongoose.model('Task', taskSchema);

// Connect to MongoDB
async function connectDB() {
  if (!MONGODB_URI) {
    console.error('Missing MONGODB_URI in environment. Set it in .env or Render env vars.');
    process.exit(1);
  }
  try {
    await mongoose.connect(MONGODB_URI, { dbName: 'cloud_todo_db' });
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
}
connectDB();

// REST API routes
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 }).lean();
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const { text, dueDate, priority } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: 'text is required' });
    const task = new Task({ text: text.trim(), dueDate: dueDate || null, priority: priority || 'medium' });
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const update = req.body;
    const task = await Task.findByIdAndUpdate(id, update, { new: true, runValidators: true }).lean();
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const task = await Task.findByIdAndDelete(id).lean();
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
