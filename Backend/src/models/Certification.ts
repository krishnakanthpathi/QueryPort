
import mongoose from "mongoose";

const certificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    issuingOrganization: {
        type: String,
        required: true,
    },
    issueDate: {
        type: Date,
        required: true,
    },
    credentialId: {
        type: String,
    },
    credentialUrl: {
        type: String,
    },
    image: {
        type: String,
        default: "https://cdn-icons-png.flaticon.com/512/2912/2912765.png", // Default certification icon
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

const Certification = mongoose.model("Certification", certificationSchema);

export default Certification;
