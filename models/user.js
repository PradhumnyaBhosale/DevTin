const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      minLength: 4,
      trim: true,
      validate(value) {
        if (!validator.isAlpha(value)) {
          throw new Error("First name should only contain letters");
        }
      },
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      validate(value) {
        if (!validator.isAlpha(value)) {
          throw new Error("Last name should only contain letters");
        }
      },
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Invalid email address");
        }
      },
    },
    password: {
      type: String,
      required: true,
      minLength: 6,
    },
    age: {
      type: Number,
      required: true,
      validate(value) {
        if (value < 18 || value > 100) {
          throw new Error("Age must be between 18 and 100");
        }
      },
    },
    gender: {
      type: String,
      required: true,
      validate(value) {
        if (!["male", "female", "other"].includes(value.toLowerCase())) {
          throw new Error("Invalid gender. Must be male, female, or other");
        }
      },
    },
    photourl: {
      type: String,
      default:
        "https://th.bing.com/th/id/OIP.jbT8ZzTPc59TsjpmnwrZngHaHa?w=208&h=209&c=7&r=0&o=5&dpr=1.3&pid=1.7",
      validate(value) {
        if (!validator.isURL(value)) {
          throw new Error("Invalid photo URL");
        }
      },
    },
    skills: {
      type: [String],
      default: [],
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
    sentRequests: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] },
    ],
    receivedRequests: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] },
    ],
    ignoredRequests: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] },
    ],
    connections: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] },
    ],
  },
  { timestamps: true }
);

// Generate JWT token
userSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  user.tokens = user.tokens.concat({ token });
  await user.save();
  return token;
};

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.tokens;
  return user;
};

// Find user by credentials
userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("Invalid login credentials");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid login credentials");
  }

  return user;
};

// Hash password before saving
userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

const User = mongoose.model("User", userSchema);
module.exports = User;
