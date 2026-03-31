const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
try {

let token = req.headers.authorization;

if (!token) {
return res.status(401).json({ message: "Not authorized" });
}

// Remove Bearer prefix if present
token = token.startsWith("Bearer ") ? token.slice(7) : token;

const decoded = jwt.verify(token, process.env.JWT_SECRET);

req.user = await User.findById(decoded.id).select("-password");

next();

} catch (error) {
res.status(401).json({ message: "Invalid token" });
}
};

module.exports = protect;