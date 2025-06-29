const express = require("express");
const router = express.Router();
const User = require("../models/user");
const { valid } = require("../utils/validation");
const bcrypt = require("bcrypt");
const auth = require("../middleware/auth");
const mongoose = require("mongoose");

// AUTH
router.post("/signup", async (req, res) => {
  try {
    console.log("Starting user creation process...");
    const { firstName, lastName, email, password, gender, age } = req.body;
    const hashed = bcrypt.hashSync(password, 10);
    valid(req);
    const user = new User({
      firstName,
      lastName,
      email,
      password: hashed,
      gender,
      age,
    });
    const savedUser = await user.save();
    console.log("User saved successfully:", savedUser);
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

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: user,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Failed to login",
      error: err.message,
    });
  }
});

router.post("/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((t) => t.token !== req.token);
    await req.user.save();
    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to logout",
      error: error.message,
    });
  }
});



// PROFILE
router.get("/profile/view", auth, async (req, res) => {
  try {
    // req.user is set by auth middleware
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
      error: error.message,
    });
  }
});

router.patch("/profile/edit", auth, async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = [
      "firstName",
      "lastName",
      "age",
      "gender",
      "photourl",
      "skills",
    ];
    const isValidOperation = updates.every((update) =>
      allowedUpdates.includes(update)
    );
    if (!isValidOperation) {
      return res.status(400).json({
        success: false,
        message: "Invalid updates!",
      });
    }
    updates.forEach((update) => (req.user[update] = req.body[update]));
    await req.user.save();
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: req.user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    });
  }
});

router.patch("/profile/password", auth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Old and new passwords are required",
      });
    }
    const isMatch = await require("bcrypt").compare(
      oldPassword,
      req.user.password
    );
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Old password is incorrect",
      });
    }
    req.user.password = newPassword;
    await req.user.save();
    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to update password",
      error: error.message,
    });
  }
});

// REQUESTS
router.post("/request/send/interested/:userID", auth, async (req, res) => {
  try {
    const targetUserId = req.params.userID;
    if (req.user._id.equals(targetUserId)) {
      return res
        .status(400)
        .json({ success: false, message: "Cannot send request to yourself" });
    }
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res
        .status(404)
        .json({ success: false, message: "Target user not found" });
    }
    if (req.user.sentRequests.includes(targetUserId)) {
      return res
        .status(400)
        .json({ success: false, message: "Request already sent" });
    }
    req.user.sentRequests.push(targetUserId);
    targetUser.receivedRequests.push(req.user._id);
    await req.user.save();
    await targetUser.save();
    res.status(200).json({ success: true, message: "Request sent" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to send request",
      error: error.message,
    });
  }
});

router.post("/request/send/ignored/:userID", auth, async (req, res) => {
  try {
    const targetUserId = req.params.userID;
    if (req.user._id.equals(targetUserId)) {
      return res
        .status(400)
        .json({ success: false, message: "Cannot ignore yourself" });
    }
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res
        .status(404)
        .json({ success: false, message: "Target user not found" });
    }
    if (req.user.ignoredRequests.includes(targetUserId)) {
      return res
        .status(400)
        .json({ success: false, message: "User already ignored" });
    }
    req.user.ignoredRequests.push(targetUserId);
    await req.user.save();
    res.status(200).json({ success: true, message: "User ignored" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to ignore user",
      error: error.message,
    });
  }
});

// REQUEST REVIEW
router.post("/request/review/accepted/:requestID", auth, async (req, res) => {
  try {
    const requestUserId = req.params.requestID;
    const requestUser = await User.findById(requestUserId);
    if (!requestUser) {
      return res
        .status(404)
        .json({ success: false, message: "Requesting user not found" });
    }
    // Remove from receivedRequests
    req.user.receivedRequests = req.user.receivedRequests.filter(
      (id) => !id.equals(requestUserId)
    );
    // Remove from sentRequests
    requestUser.sentRequests = requestUser.sentRequests.filter(
      (id) => !id.equals(req.user._id)
    );
    // Add to connections
    req.user.connections.push(requestUserId);
    requestUser.connections.push(req.user._id);
    await req.user.save();
    await requestUser.save();
    res
      .status(200)
      .json({ success: true, message: "Request accepted, now connected" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to accept request",
      error: error.message,
    });
  }
});

router.post("/request/review/rejected/:requestID", auth, async (req, res) => {
  try {
    const requestUserId = req.params.requestID;
    const requestUser = await User.findById(requestUserId);
    if (!requestUser) {
      return res
        .status(404)
        .json({ success: false, message: "Requesting user not found" });
    }
    // Remove from receivedRequests
    req.user.receivedRequests = req.user.receivedRequests.filter(
      (id) => !id.equals(requestUserId)
    );
    // Remove from sentRequests
    requestUser.sentRequests = requestUser.sentRequests.filter(
      (id) => !id.equals(req.user._id)
    );
    await req.user.save();
    await requestUser.save();
    res.status(200).json({ success: true, message: "Request rejected" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to reject request",
      error: error.message,
    });
  }
});

// CONNECTIONS & FEED
router.get("/connections", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "connections",
      "firstName lastName email photourl"
    );
    res.status(200).json({ success: true, connections: user.connections });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get connections",
      error: error.message,
    });
  }
});

router.get("/request/received", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "receivedRequests",
      "firstName lastName email photourl"
    );
    res
      .status(200)
      .json({ success: true, receivedRequests: user.receivedRequests });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get received requests",
      error: error.message,
    });
  }
});

router.get("/feed", async (req, res) => {
  try {
    const user = await User.find({});
    res.send(user);
  } catch (err) {
    console.log(err);
    res.status(404).json({
      success: false,
      message: "Failed to get user",
      error: err.message,
    });
  }
});

// USER MANAGEMENT
router.get("/users", async (req, res) => {
  const cookies = req.cookies;
  try {
    const email = req.body.email;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    console.log(user);
    return res.status(200).json({
      success: true,
      user: user,
    });
  } catch (error) {
    console.error("Error in getting user:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get user",
      error: error.message,
    });
  }
});

router.delete("/user", async (req, res) => {
  try {
    const id = req.body.id;
    const user = await User.findByIdAndDelete({ _id: id });
    res.send(user);
  } catch (err) {
    console.log(err);
    res.status(404).json({
      success: false,
      message: "Failed to delete user",
      error: err.message,
    });
  }
});

router.patch("/user", async (req, res) => {
  try {
    const id = req.body.id;
    const user = await User.findByIdAndUpdate({ _id: id }, req.body, {
      returnDocument: "after",
    });
    res.send(user);
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Failed to update user",
      error: err.message,
    });
  }
});

// Update user by ID
router.patch("/user/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const updateData = req.body;
    const user = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Failed to update user",
      error: err.message,
    });
  }
});

module.exports = router;
