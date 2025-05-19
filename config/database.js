const mongoose = require("mongoose");

const connection = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/Tinder", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connection established");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
};

module.exports = connection;
