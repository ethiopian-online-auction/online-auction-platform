const express = require("express");
const router = express.Router();

const { placeBid } = require("../controllers/bidController");

const protect = require("../middleware/authMiddleware");

router.post("/:id", protect, placeBid);

module.exports = router;