const express = require("express");
const formidable = require("express-formidable");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const cors = require("cors");

//installation de dotenv package pour cacher les infos - code - key - api...
require("dotenv").config();

const app = express();
app.use(formidable());

app.use(cors());

mongoose.connect(process.env.MONGODB_URI);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY_NAME,
  api_secret: process.env.CLOUDINARY_API_SECRET_NAME,
});

// import des routes
const userRoutes = require("./routes/user");
app.use(userRoutes);
const offerRoutes = require("./routes/offer");
app.use(offerRoutes);

// const paymentRoutes = require("./routes/payment");
// app.use(paymentRoutes);

app.get("/", (req, res) => {
  res.json("API Vinted");
});

app.all("*", (req, res) => {
  res.status(404).json({ message: "Page not found !" });
});

app.listen(process.env.PORT, () => {
  console.log(`Server Started on port: ${process.env.PORT}`);
});
