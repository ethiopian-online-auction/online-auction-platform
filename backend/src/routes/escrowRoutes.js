const express = require("express");
const router = express.Router();

const {
shipItem,
confirmDelivery,
openDispute,
refundBuyer
} = require("../controllers/escrowController");

const protect = require("../middleware/authMiddleware");

router.post("/ship/:id", protect, shipItem);
router.post("/confirm/:id", protect, confirmDelivery);
router.post("/dispute/:id", protect, openDispute);
router.post("/refund/:id", protect, refundBuyer);

module.exports = router;