
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/user");

async function createAdmin() {
    try {
        await mongoose.connect(
"mongodb://127.0.0.1:27017/leavemanagement"
        );

        const email = "admin@gmail.com";
        const hashedPassword = await bcrypt.hash("Admin123", 10);

        let admin = await User.findOne({ email });

        if (admin) {
            admin.username = "Admin";
            admin.password = hashedPassword;
            admin.role = "admin";
            admin.rollNumber = admin.rollNumber || "ADMIN001";
            await admin.save();

            console.log("Admin account updated successfully.");
        } else {
            await User.create({
                username: "Admin",
                email: email,
                password: hashedPassword,
                rollNumber: "ADMIN001",
                role: "admin",
                casualLeave: 10,
                medicalLeave: 10
            });

            console.log("Admin account created successfully.");
        }
    } catch (error) {
        console.log("Error:", error.message);
    } finally {
        await mongoose.disconnect();
    }
}

createAdmin();
