require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const userRoutes = require("./routes/userRoutes");

const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "User service is healthy"
  });
});

app.use("/users", userRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});


app.use((error, req, res, next) => {
  console.error("ERROR:", error);
  res.status(error.status || 500).json({
    success: false,
    message: error.message || "Internal server error"
  });
});

module.exports = app;
