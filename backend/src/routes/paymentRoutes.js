const express = require("express");
const router = express.Router();

const { payAuction } = require("../controllers/paymentController");

const protect = require("../middleware/authMiddleware");

router.post("/:id", protect, payAuction);

module.exports = router;