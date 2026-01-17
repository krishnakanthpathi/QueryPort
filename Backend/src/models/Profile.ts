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
        skills: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Skill',
            },
        ],
    },
    {
        timestamps: true,
    }
);

const Profile = mongoose.model('Profile', profileSchema);

export default Profile;
