
const express = require("express");
const router = express.Router();
const Staff = require("../models/Staff");

// View all staff
router.get("/", async (req, res) => {
    try {
        const staff = await Staff.find();
        res.json(staff);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add staff
router.post("/", async (req, res) => {
    try {
        const staff = new Staff(req.body);
        await staff.save();
        res.status(201).json(staff);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete staff
router.delete("/:id", async (req, res) => {
    try {
        const staff = await Staff.findByIdAndDelete(req.params.id);

        if (!staff) {
            return res.status(404).json({
                message: "Staff not found"
            });
        }

        res.json({ message: "Staff deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
