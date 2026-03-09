
import mongoose from "mongoose";

const skillSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    normalizedName: {
        type: String,
        index: true,
    },
    image: {
        type: String,
        default: "https://cdn-icons-png.flaticon.com/512/3665/3665975.png", // Default skill icon
    },
    scope: {
        type: String,
        enum: ["global", "user"],
        default: "global",
        index: true,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        // Required only when scope is "user"
        required: function (this: any): boolean {
            return this.scope === "user";
        },
        index: true,
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

// Ensure normalizedName is always set based on name
skillSchema.pre("save", function () {
    if ((this as any).name) {
        (this as any).normalizedName = (this as any).name.toLowerCase().trim();
    }
});

// Unique constraint per (normalizedName, scope, owner)
skillSchema.index(
    { normalizedName: 1, scope: 1, owner: 1 },
    { unique: true }
);

const Skill = mongoose.model("Skill", skillSchema);

export default Skill;
