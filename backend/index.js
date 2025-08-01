const express = require("express");
const morgan = require("morgan");
const { connectDB } = require("./config/db");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const { setupSwagger } = require("./config/swagger");
// Import routes
const userRoutes = require("./routes/userRoutes");
const organizationRoutes = require("./routes/organizationRoutes");
const projectRoutes = require("./routes/projectRoutes");
const observationRoutes = require("./routes/observationRoutes");
const inspectionStationRoutes = require("./routes/inspectionStationRoutes");
const cameraRoutes = require("./routes/cameraRoutes");
const imageRoutes = require("./routes/imageRoutes");
const datasetRoutes = require("./routes/datasetRoutes");

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Serve uploaded images
const path = require("path");
app.use("/storage", express.static(path.join(__dirname, "../storage")));
app.use(cookieParser());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/observations", observationRoutes);
app.use("/api/inspection-stations", inspectionStationRoutes);
app.use("/api/cameras", cameraRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/datasets", datasetRoutes);
// Root route
app.get("/", (req, res) => {
  res.send("EagleEye Backend is running...");
});

// Setup Swagger documentation
setupSwagger(app);

// Start server
async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! Shutting down...");
  console.error(err);
  process.exit(1);
});

// Only start server if this file is run directly, not when imported for testing
if (require.main === module) {
  startServer();
}

module.exports = app;
