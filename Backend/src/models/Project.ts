
// creating project model 

import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
    // user id of project owner
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    skills: {
        type: String
    },
    // array of links
    links: {
        type: [String]
    },
    // array of images
    images: {
        type: [String]
    },
    // avatar of project
    avatar: {
        type: String,
        default: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
    },
    // project status
    status: {
        type: String,
        enum: ["draft", "published"],
        default: "draft",
    },
    // project category
    category: {
        type: String,
        enum: ["personal", "professional", "others"],
        default: "personal",
    },
    // project start date
    startDate: {
        type: Date,
    },
    // project end date
    endDate: {
        type: Date,
    },
    // project budget
    budget: {
        type: Number,
    },
    // project tags
    tags: {
        type: [String],
    },
    // project views
    views: {
        type: Number,
        default: 0,
    },
    // project likes
    likes: {
        type: Number,
        default: 0,
    },
    // project comments
    comments: {
        type: Number,
        default: 0,
    },
    // project shares
    shares: {
        type: Number,
        default: 0,
    },
    // contributors
    contributors: {
        type: [String],
    },
    // project created at
    createdAt: {
        type: Date,
        default: Date.now,
    },
    // project updated at
    updatedAt: {
        type: Date,
        default: Date.now,
    },
})

const Project = mongoose.model("Project", projectSchema);

export default Project;


