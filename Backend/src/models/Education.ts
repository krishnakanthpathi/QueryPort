
import mongoose from "mongoose";

const semesterSchema = new mongoose.Schema({
    semester: {
        type: Number,
        required: true
    },
    sgpa: {
        type: String, // Allowing alphanumeric for flexibility, though typically number string
        required: true
    },
    cgpa: {
        type: String
    },
    gradeSheet: {
        type: String // URL
    }
}, { _id: false });

const educationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    institution: {
        type: String,
        required: true,
    },
    degree: {
        type: String,
        required: true,
    },
    fieldOfStudy: {
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
    score: {
        type: String, // Overall CGPA/Percentage
    },
    semesters: [semesterSchema],
    description: {
        type: String,
    },
    logo: {
        type: String,
        default: "https://cdn-icons-png.flaticon.com/512/2997/2997353.png", // Default school icon
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

const Education = mongoose.model("Education", educationSchema);

export default Education;
