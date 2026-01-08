import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import AppError from './utils/AppError.js';
import routes from './routes/index.js';
import globalErrorHandler from './controllers/errorController.js';

dotenv.config();

connectDB();


const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1', routes);

// Sample route
app.get('/', (req, res) => {
  // welcome route
  res.send(JSON.stringify({ message: 'Welcome to the API' }));

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