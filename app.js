
const express = require("express");
const path = require("path");

const connectDB = require("./config/db");

const leaveRoutes = require("./routes/leaveroutes");
const adminRoutes = require("./routes/adminRoutes");
const staffRoutes = require("./routes/staffRoutes");

const app = express();
const PORT = 5050;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Frontend files
app.use(express.static(path.join(__dirname, "public")));

// Leave management routes
app.use("/api", leaveRoutes);

// Admin dashboard routes
app.use("/api/admin", adminRoutes);

// Staff management routes
app.use("/api/staff", staffRoutes);

// Home page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start server
async function startServer() {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log("Server running on port " + PORT);
            console.log("MongoDB Connected Successfully");
            console.log("Student API: /api");
            console.log("Admin API: /api/admin");
            console.log("Staff API: /api/staff");
        });
    } catch (error) {
        console.error("Database connection failed:", error.message);
    }
}

startServer();
