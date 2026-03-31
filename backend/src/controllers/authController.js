const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


// Register
exports.register = async (req, res) => {
try {

const { name, email, password, role } = req.body;

const userExists = await User.findOne({ email });

if (userExists) {
return res.status(400).json({ message: "User already exists" });
}

const hashedPassword = await bcrypt.hash(password, 10);

const user = await User.create({
name,
email,
password: hashedPassword,
role
});

const userResponse = {
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt
};

res.status(201).json({
message: "User registered",
user: userResponse
});

} catch (error) {
res.status(500).json({ error: error.message });
}
};


// Login
exports.login = async (req, res) => {
try {

const { email, password } = req.body;

const user = await User.findOne({ email });
console.log("USER:", user);
if (!user) {
console.log("User not found:", email);
return res.status(400).json({ message: "Invalid credentials" });
}

const isMatch = await bcrypt.compare(password, user.password);
console.log("MATCH:", isMatch);

if (!isMatch) {
console.log("Password mismatch for user:", email);
return res.status(400).json({ message: "Invalid credentials" });
}

const token = jwt.sign(
{ id: user._id, role: user.role },
process.env.JWT_SECRET,
{ expiresIn: "7d" }
);

const userResponse = {
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role
};

res.json({
token,
user: userResponse
});

} catch (error) {
res.status(500).json({ error: error.message });
}
};