import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import apiRouter from './routes/api.routes';
import Product from './models/product.model';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend development
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

// Main API mounting
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    database: mongoose.connection.readyState === 1 ? 'mongodb' : 'json-fallback',
    time: new Date().toISOString()
  });
});

const mongoURI = process.env.MONGODB_URI;

if (mongoURI) {
  console.log('[Server] Connecting to MongoDB at:', mongoURI.replace(/:[^@]+@/, ':***@')); // Hide credentials
  mongoose.connect(mongoURI)
    .then(async () => {
      console.log('[Server] MongoDB connection established.');
      
      // Auto-seed empty database in production
      try {
        const count = await Product.countDocuments();
        if (count === 0) {
          console.log('[Server] Connected MongoDB database is empty. Autoseeding catalog...');
          const fallbackPath = path.join(__dirname, 'fallback_db.json');
          if (fs.existsSync(fallbackPath)) {
            const raw = fs.readFileSync(fallbackPath, 'utf-8');
            const data = JSON.parse(raw);
            await Product.insertMany(data);
            console.log(`[Server] Database successfully auto-seeded with ${data.length} products!`);
          } else {
            console.warn('[Server] Auto-seed failed: fallback_db.json not found at:', fallbackPath);
          }
        }
      } catch (err) {
        console.error('[Server] Autoseeding check error:', err);
      }
    })
    .catch((err) => {
      console.error('[Server] MongoDB connection failed:', err);
      console.log('[Server] Falling back to JSON database files.');
    });
} else {
  console.log('[Server] MONGODB_URI not provided. Running with Local JSON file fallback.');
}

app.listen(PORT, () => {
  console.log(`[Server] Express server running on port ${PORT}`);
});
