const express = require("express");
const cors = require("cors");
require("dotenv").config();

const cron = require("node-cron");
const autoEndAuctions = require("./src/utils/auctionAutoEnd");

cron.schedule("*/10 * * * * *", () => {
autoEndAuctions();
});

const paymentRoutes = require("./src/routes/paymentRoutes");

const escrowRoutes = require("./src/routes/escrowRoutes");



const connectDB = require("./src/config/db");
const authRoutes = require("./src/routes/authRoutes");
const protect = require("./src/middleware/authMiddleware");
const authorize = require("./src/middleware/roleMiddleware");
const bidRoutes = require("./src/routes/bidRoutes");


const auctionRoutes = require("./src/routes/auctionRoutes");

const app = express();
app.use("/api/escrow", escrowRoutes);
app.use(cors());
app.use(express.json());
app.use("/api/payments", paymentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/auctions", auctionRoutes);

app.get(
"/api/admin",
protect,
authorize("super_admin", "admin"),
(req, res) => {
res.json("Admin dashboard");
}
);

app.get("/", (req, res) => {
  res.send("Auction API running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

connectDB();