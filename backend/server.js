import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import {connectDB } from './config/db.js';
import curriculumRoutes from './routes/curriculumRoutes.js';
import jobRoutes from "./routes/jobRoutes.js";

// Resolve __dirname for ESM and load environment variables from this file's folder
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });
const app = express();
// Middleware to parse JSON requests
app.use(express.json());

// Connect to the database
connectDB();        


// Use curriculum routes
app.use('/api/curricula', curriculumRoutes);

// Use job routes
app.use("/api/jobs", jobRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));