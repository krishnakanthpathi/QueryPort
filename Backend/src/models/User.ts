import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please tell us your name!'],
        },
        username: {
            type: String,
            required: [true, 'Please tell us your username!'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Please provide your email'],
            unique: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: [false, 'Please provide a password'], // Optional for Google Auth
            minlength: 8,
            select: false,
        },
        googleId: {
            type: String,
        },
        avatar: {
            type: String,
            default: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
        },
        passwordChangedAt: Date,
    },
    {
        timestamps: true,
    }
);

// hash password
userSchema.pre('save', async function (this: any) {
    if (!this.isModified('password') || !this.password) return;

    this.password = await bcrypt.hash(this.password, 12);
});

// compare password
userSchema.methods.correctPassword = async function (
    candidatePassword: string,
    userPassword: string
) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

// check if password changed after JWT timestamp
userSchema.methods.changedPasswordAfter = function (JWTTimestamp: number) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(
            (this.passwordChangedAt.getTime() / 1000).toString(),
            10
        );
        return JWTTimestamp < changedTimestamp;
    }

    // False means NOT changed
    return false;
};

// create model
const User = mongoose.model('User', userSchema);

export default User;
