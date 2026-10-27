
const express = require("express");
const router = express.Router();

const User = require("../models/user");
const Leave = require("../models/leave");

// Admin dashboard counts
router.get("/dashboard", async (req, res) => {
    try {
        const totalStudents = await User.countDocuments({
            role: "student"
        });

        const pendingLeaves = await Leave.countDocuments({
            status: "Pending"
        });

        const approvedLeaves = await Leave.countDocuments({
            status: "Approved"
        });

        const rejectedLeaves = await Leave.countDocuments({
            status: "Rejected"
        });

        res.json({
            totalStudents,
            pendingLeaves,
            approvedLeaves,
            rejectedLeaves
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all students
router.get("/students", async (req, res) => {
    try {
        const students = await User.find({
            role: "student"
        }).select("-password");

        res.json(students);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all leave requests
router.get("/leaves", async (req, res) => {
    try {
        const leaves = await Leave.find()
            .populate("studentId", "username email rollNumber")
            .sort({ createdAt: -1 });

        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Approve or reject leave
router.put("/leave/:id", async (req, res) => {
    try {
        const { status } = req.body;

        if (!["Approved", "Rejected"].includes(status)) {
            return res.status(400).json({
                message: "Invalid leave status"
            });
        }

        const leave = await Leave.findById(req.params.id);

        if (!leave) {
            return res.status(404).json({
                message: "Leave request not found"
            });
        }

        if (leave.status !== "Pending") {
            return res.status(400).json({
                message: "This leave request is already processed"
            });
        }

        if (status === "Approved") {
            const student = await User.findById(leave.studentId);

            if (!student) {
                return res.status(404).json({
                    message: "Student not found"
                });
            }

            const field = leave.leaveType === "casual"
                ? "casualLeave"
                : "medicalLeave";

            if (student[field] < leave.days) {
                return res.status(400).json({
                    message: "Insufficient leave balance"
                });
            }

            student[field] -= leave.days;
            await student.save();
        }

        leave.status = status;
        await leave.save();

        res.json({
            message: "Leave " + status.toLowerCase() + " successfully",
            leave
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
