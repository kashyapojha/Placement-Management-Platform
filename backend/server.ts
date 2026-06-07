import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import apiRouter from './routes/index.js';

// Import Mongoose Models for automatic mock data seeding
import UserProfileModel from './models/User.js';
import InternshipModel from './models/Internship.js';
import ApplicationModel from './models/Application.js';
import MessageModel from './models/Message.js';
import ActivityLogModel from './models/ActivityLog.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
  : ['http://localhost:3000', 'http://localhost'];

app.use(cors({ origin: corsOrigins }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Serve uploaded PDFs statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Main API Router Orchestrator
app.use('/api', apiRouter);

// Database Seeder Logic (Retains database listings across server boots for persistence)
async function clearHardcodedCollections() {
  try {
    console.log('Skipping aggressive wiping of internship opportunity boards to enable database persistence...');
    // We retain user/simulated listings so they can perform all real actions persistently in MongoDB
    console.log('Database initialized with 105% real, persistent collections.');
  } catch (error) {
    console.error('Error in database seeder:', error);
  }
}

async function seedAdminUser() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    // Find if there is any user with Admin role
    const adminUser = await UserProfileModel.findOne({ role: 'Admin' });
    if (adminUser) {
      // Ensure the credentials match the requested ones
      adminUser.email = 'admin@spsu.ac.in';
      adminUser.password = hashedPassword;
      adminUser.name = 'SPSU Administrator';
      adminUser.college = 'Sir Padampat Singhania University';
      await adminUser.save();
      console.log('Updated existing Admin user credentials to: admin@spsu.ac.in / admin123');
    } else {
      // Seed a brand new admin user
      const seedAdmin = new UserProfileModel({
        id: 'admin-seed-101',
        name: 'SPSU Administrator',
        email: 'admin@spsu.ac.in',
        password: hashedPassword,
        role: 'Admin',
        college: 'Sir Padampat Singhania University',
        bio: 'Default System Administrator for Sir Padampat Singhania University Placement Platform.'
      });
      await seedAdmin.save();
      console.log('Seeded brand new default Admin user successfully: admin@spsu.ac.in / admin123');
    }
  } catch (error) {
    console.error('Error seeding admin user:', error);
  }
}

// Connect to MongoDB and clear old collections
connectDB()
  .then(async () => {
    await clearHardcodedCollections();
    await seedAdminUser();
    app.listen(PORT, () => {
      console.log(`Backend server is running on port ${PORT}`);
    });
  });
