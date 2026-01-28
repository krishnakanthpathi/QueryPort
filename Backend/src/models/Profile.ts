import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },
        bio: {
            type: String,
            maxlength: [500, 'Bio cannot be more than 500 characters'],
        },
        title: {
            type: String,
            maxlength: [100, 'Title cannot be more than 100 characters'],
        },
        socialLinks: [
            {
                platform: { type: String, required: true },
                url: { type: String, required: true },
            },
        ],
        resume: {
            type: String,
        },
        locations: {
            type: String,
        },
        codingProfiles: {
            github: { type: String, default: '' },
            leetcode: { type: String, default: '' },
            codeforces: { type: String, default: '' },
            hackerrank: { type: String, default: '' },
            codechef: { type: String, default: '' },
        },
        skills: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Skill',
            },
        ],
        stats: {
            totalLikes: { type: Number, default: 0 },
            leetcode: {
                solved: { type: Number, default: 0 },
                ranking: { type: Number, default: 0 }
            },
            codeforces: {
                rating: { type: Number, default: 0 },
                maxRating: { type: Number, default: 0 }
            },
            hackerrank: {
                badges: { type: Number, default: 0 },
                points: { type: Number, default: 0 }
            },
            github: {
                contributions: { type: Number, default: 0 }
            },
            cgpa: { type: Number, default: 0 }
        },
        type: {
            type: String,
            enum: ['Student', 'Professional', 'Alumni', 'Other'],
            default: 'Student'
        },
    },
    {
        timestamps: true,
    }
);

const Profile = mongoose.model('Profile', profileSchema);

export default Profile;
