const express = require("express");
connection = require("./config/database");
const User = require("./models/user");

const app = express();
app.use(express.json());

app.post("/signup", async (req, res) => {
  try {
    console.log("Starting user creation process...");

    // Create new user instance
    const user = new User({
      firstName: "Rohit",
      lastName: "Sharma",
      email: "Hitman@gmail.com",
      password: "454545",
      age: 36,
      gender: "Male",
    });

    // Save the user
    const savedUser = await user.save();
    console.log("User saved successfully:", savedUser);

    // Send success response
    return res.status(201).json({
      success: true,
      message: "User created successfully",
      user: savedUser,
    });
  } catch (error) {
    console.error("Error in signup:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create user",
      error: error.message,
    });
  }
});

connection()
  .then(() => {
    console.log("Database connected successfully");
    app.listen(3000, () => {
      console.log("Server running on Port 3000");
    });
  })
  .catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
