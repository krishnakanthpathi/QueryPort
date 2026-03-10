import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import AppError from './utils/AppError.js';
import routes from './routes/index.js';
import globalErrorHandler from './controllers/errorController.js';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import { startLeaderboardCron } from './cron/leaderboardCron.js';

dotenv.config();

const app = express();

const limiter = rateLimit({
  max: 500, // Temporary limit for testing
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many requests from this IP, please try again in an hour!'
});

app.use('/api', limiter);
app.use(compression());

app.use(cors({ origin: '*' }));
// Increase JSON body size limit to better support typical payloads
app.use(express.json({ limit: '1mb' }));

// Routes
app.use('/api/v1', routes);

// Sample route
app.get('/', (req, res) => {
  // welcome route
  res.send(JSON.stringify({ message: 'Welcome to the API' }));

});

app.get('/api/v1', (req, res) => {
  // welcome route
  res.send(JSON.stringify({ message: 'Welcome to the API v1' }));
});

// Handle unhandled routes
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(globalErrorHandler);

// Start the server and weekly leaderboard sync daemon
const PORT = process.env.PORT || 3000;
const DISABLE_LEADERBOARD_CRON = process.env.DISABLE_LEADERBOARD_CRON === '1' || process.env.DISABLE_LEADERBOARD_CRON === 'true';

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    if (!DISABLE_LEADERBOARD_CRON) {
      startLeaderboardCron();
    } else {
      console.log('[Leaderboard cron] Disabled via DISABLE_LEADERBOARD_CRON');
    }
  });
}

start();

export default app;