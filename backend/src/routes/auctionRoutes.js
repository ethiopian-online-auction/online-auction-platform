const express = require("express");
const router = express.Router();

const {
createAuction,
getAuctions,
getAuction
} = require("../controllers/auctionController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

router.post(
"/",
protect,
authorize("seller", "admin", "super_admin"),
createAuction
);

router.get("/", getAuctions);
router.get("/:id", getAuction);

module.exports = router;