const mongoose = require("mongoose");

// userId,userType,name, email,mobile, password,otp,status
const userSchema = new mongoose.Schema({
  // userId: { type: String, default: null },
  userType: { type: String, enum:["SAdmin","CollUser", "Student"] },
  name: { type: String, default: null },
  email: { type: String, unique: true },
  mobile: { type: String, default: null },
  password: { type: String },
  status:{ type: Boolean, default: false },
  isMailVerified: { type: Boolean, default: false},
  registrationNumber: String,
  examRoll: String
});

module.exports = mongoose.model("User", userSchema);
