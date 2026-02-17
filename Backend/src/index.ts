import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import AppError from './utils/AppError.js';
import routes from './routes/index.js';
import globalErrorHandler from './controllers/errorController.js';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

dotenv.config();

connectDB();


const app = express();

app.use(helmet());

const limiter = rateLimit({
  max: 500, // Temporary limit for testing
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many requests from this IP, please try again in an hour!'
});

app.use('/api', limiter);
app.use(compression());

app.use(cors());
app.use(express.json({ limit: '10kb' }));

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

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;