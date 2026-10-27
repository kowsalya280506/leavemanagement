
const mongoose = require("mongoose");

async function connectDB() {
    await mongoose.connect(
        "mongodb://127.0.0.1:27017/leave-management"
    );

    console.log("MongoDB Connected Successfully");
}

module.exports = connectDB;
