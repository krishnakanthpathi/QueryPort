
import express from "express";

const router = express.Router();


// create project
router.post("/", (req, res) => {
    res.send("Projects");
});

// get all projects
router.get("/", (req, res) => {
    res.send("Projects");
});

// get project by id
router.get("/:id", (req, res) => {
    res.send("Projects");
});

// update project
router.put("/:id", (req, res) => {
    res.send("Projects");
});

// delete project
router.delete("/:id", (req, res) => {
    res.send("Projects");
});


export default router;