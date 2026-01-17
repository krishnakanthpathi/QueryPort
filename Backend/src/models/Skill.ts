
import mongoose from "mongoose";

const skillSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    image: {
        type: String,
        default: "https://cdn-icons-png.flaticon.com/512/3665/3665975.png", // Default skill icon
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Skill = mongoose.model("Skill", skillSchema);

export default Skill;
