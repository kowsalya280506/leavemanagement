
const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();

const User = require("../models/user");
const Leave = require("../models/leave");

// Register student
router.post("/register", async (req, res) => {
    try {
        const { username, email, password, rollNumber } = req.body;

        if (!username || !email || !password || !rollNumber) {
            return res.status(400).json({
                message: "Please fill all fields"
            });
        }

        const existingUser = await User.findOne({
            email: email.trim().toLowerCase()
        });

        if (existingUser) {
            return res.status(400).json({
                message: "Email already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            username: username.trim(),
            email: email.trim().toLowerCase(),
            password: hashedPassword,
            rollNumber: rollNumber.trim(),
            role: "student",
            casualLeave: 10,
            medicalLeave: 10
        });

        res.status(201).json({
            message: "Student registered successfully",
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                rollNumber: user.rollNumber,
                role: user.role,
                casualLeave: user.casualLeave,
                medicalLeave: user.medicalLeave
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Enter email and password"
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase()
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const passwordMatches = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatches) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        res.json({
            message: "Login successful",
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                rollNumber: user.rollNumber,
                role: user.role,
                casualLeave: user.casualLeave,
                medicalLeave: user.medicalLeave
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get leave balance
router.get("/leave-balance/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select("username email rollNumber role casualLeave medicalLeave");

        if (!user) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        res.json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Apply for leave
router.post("/apply-leave", async (req, res) => {
    try {
        const { studentId, leaveType, startDate, endDate, reason } = req.body;

        if (!studentId || !leaveType || !startDate || !endDate || !reason) {
            return res.status(400).json({
                message: "Please fill all leave fields"
            });
        }

        if (!["casual", "medical"].includes(leaveType)) {
            return res.status(400).json({
                message: "Select a valid leave type"
            });
        }

        // Parse dates consistently
        const start = new Date(startDate + "T00:00:00.000Z");
        const end = new Date(endDate + "T00:00:00.000Z");

        if (
            Number.isNaN(start.getTime()) ||
            Number.isNaN(end.getTime())
        ) {
            return res.status(400).json({
                message: "Invalid date"
            });
        }

        if (end < start) {
            return res.status(400).json({
                message: "End date cannot be before start date"
            });
        }

        // Count both the start and end dates
        const days = Math.floor(
            (end.getTime() - start.getTime()) / 86400000
        ) + 1;

        const student = await User.findById(studentId);

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        const balanceField = leaveType === "casual"
            ? "casualLeave"
            : "medicalLeave";

        const balance = Number(student[balanceField] ?? 0);

        if (days > balance) {
            return res.status(400).json({
                message: `Insufficient leave balance. You have ${balance} ${leaveType} leave days remaining, but requested ${days} days.`
            });
        }

        // Prevent overlapping pending or approved leave requests
        const overlappingLeave = await Leave.findOne({
            studentId: student._id,
            status: { $in: ["Pending", "Approved"] },
            startDate: { $lte: end },
            endDate: { $gte: start }
        });

        if (overlappingLeave) {
            return res.status(400).json({
                message: "These dates overlap an existing pending or approved leave request"
            });
        }

        const leave = await Leave.create({
            studentId: student._id,
            leaveType,
            startDate: start,
            endDate: end,
            days,
            reason: reason.trim(),
            status: "Pending"
        });

        // Balance is deducted only after admin approval
        res.status(201).json({
            message: `${days}-day leave request submitted successfully. Waiting for admin approval.`,
            leave
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get student's leave history
router.get("/my-leaves/:id", async (req, res) => {
    try {
        const student = await User.findById(req.params.id);

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        const leaves = await Leave.find({
            studentId: student._id
        }).sort({ createdAt: -1 });

        res.json(leaves);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
