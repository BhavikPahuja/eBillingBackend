require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const billRoutes = require("./routes/billRoutes");
const cors = require("cors");
const path = require("path");

const app = express();
connectDB();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api", billRoutes);

// Serve PDFs statically
app.use("/pdfs", express.static(path.join(__dirname, "pdfs")));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
