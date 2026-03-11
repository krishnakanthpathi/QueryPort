import type { Request, Response, NextFunction } from 'express';
import AppError from '../utils/AppError.js';

const sendErrorDev = (err: AppError, res: Response) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack,
    });
};

const sendErrorProd = (err: AppError, res: Response) => {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    } else {
        // Programming or other unknown error: don't leak error details
        console.error('ERROR 💥', err);
        res.status(500).json({
            status: 'error',
            message: 'Something went very wrong!',
        });
    }
};

const SESSION_EXPIRED_MESSAGE = 'Session expired or invalid. Please log in again.';

const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // JWT expired or invalid → 401 so frontend can auto-logout
    if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
        err.statusCode = 401;
        err.status = 'fail';
        if (process.env.NODE_ENV !== 'development') {
            err.message = SESSION_EXPIRED_MESSAGE;
        }
    }

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    } else {
        // Clone the error object to modify it without affecting the original
        let error = { ...err };
        error.message = err.message;

        // Handle Mongoose CastError
        if (err.name === 'CastError') {
            const message = `Invalid ${err.path}: ${err.value}.`;
            error = new AppError(message, 400);
        }

        // Handle Mongoose Duplicate Key Error
        if (err.code === 11000) {
            const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
            const message = `Duplicate field value: ${value}. Please use another value!`;
            error = new AppError(message, 400);
        }

        // Handle body size limit errors from express.json
        if (err.type === 'entity.too.large' || err.statusCode === 413) {
            error = new AppError('Request body too large', 413);
        }

        // Handle Mongoose Validation Error
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map((el: any) => el.message);
            const message = `Invalid input data. ${errors.join('. ')}`;
            error = new AppError(message, 400);
        }

        sendErrorProd(error, res);
    }
};

export default globalErrorHandler;
