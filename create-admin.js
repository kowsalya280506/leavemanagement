
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/user");

async function createAdmin() {
    try {
        await mongoose.connect(
            "mongodb://127.0.0.1:27017/leave-management"
        );

        const email = "admin@gmail.com";
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            existingUser.role = "admin";
            await existingUser.save();
            console.log("Existing account changed to admin.");
        } else {
            const password = await bcrypt.hash("Admin123", 10);

            await User.create({
                username: "Admin",
                email: email,
                password: password,
                rollNumber: "ADMIN001",
                role: "admin",
                casualLeave: 10,
                medicalLeave: 10
            });

            console.log("Admin account created successfully.");
        }

        await mongoose.disconnect();
    } catch (error) {
        console.log("Error:", error.message);
        await mongoose.disconnect();
    }
}

createAdmin();
