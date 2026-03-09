
import mongoose from "mongoose";

const experienceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    company: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        required: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
    },
    current: {
        type: Boolean,
        default: false,
    },
    description: {
        type: String,
    },
    location: {
        type: String,
    },
    logo: {
        type: String,
        default: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png", // Default company icon
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

const Experience = mongoose.model("Experience", experienceSchema);

export default Experience;
