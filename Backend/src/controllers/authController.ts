import type { Request, Response, NextFunction } from 'express';

// Auths
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

// Utils
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

// Models
import User from '../models/User.js';

const signToken = (id: string) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
        expiresIn: process.env.JWT_EXPIRES_IN || '5d',
    } as jwt.SignOptions);
};

const createSendToken = (user: any, statusCode: number, res: Response) => {
    const token = signToken(user._id);

    // Remove password from output
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user,
        },
    });
};

export const signup = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const newUser = await User.create({
        name: req.body.name,
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        avatar: req.body.avatar,
    });

    createSendToken(newUser, 201, res);
});

export const login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { identifier, password } = req.body;

    // 1) Check if identifier and password exist
    if (!identifier || !password) {
        return next(new AppError('Please provide email/username and password!', 400));
    }

    // 2) Check if user exists && password is correct
    const user = await User.findOne({
        $or: [{ email: identifier }, { username: identifier }]
    }).select('+password');

    if (!user || !(await (user as any).correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email/username or password', 401));
    }

    // 3) If everything ok, send token to client
    createSendToken(user, 200, res);
});

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleAuth = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { credential } = req.body;

    const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID || '',
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
        return next(new AppError('Invalid Google Token', 400));
    }

    let user = await User.findOne({ email: payload.email });

    if (!user) {
        // Generate random username: name-slug + random-4-digits
        const baseName = (payload.name || 'user').toLowerCase().replace(/\s+/g, '');
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const generatedUsername = `${baseName}${randomSuffix}`;

        user = await User.create({
            name: payload.name || 'User',
            username: generatedUsername,
            email: payload.email,
            googleId: payload.sub,
            avatar: payload.picture || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
        });
    }

    createSendToken(user, 200, res);
});

export const protect = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // 1) Getting token and check of it's there
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(
            new AppError('You are not logged in! Please log in to get access.', 401)
        );
    }

    // 2) Verification token
    // @ts-ignore
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

    // 3) Check if user still exists
    const currentUser = await User.findById((decoded as any).id);
    if (!currentUser) {
        return next(
            new AppError(
                'The user belonging to this token does no longer exist.',
                401
            )
        );
    }

    // 4) Check if user changed password after the token was issued
    if ((currentUser as any).changedPasswordAfter((decoded as any).iat)) {
        return next(new AppError('User recently changed password! Please log in again.', 401));
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    (req as any).user = currentUser;
    next();
});
