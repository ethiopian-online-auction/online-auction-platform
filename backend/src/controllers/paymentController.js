const Auction = require("../models/Auction");


// Winner pays
exports.payAuction = async (req, res) => {
try {

const auction = await Auction.findById(req.params.id);

if (!auction) {
return res.status(404).json({
message: "Auction not found"
});
}

// must be ended
if (auction.status !== "ended") {
return res.status(400).json({
message: "Auction not ended yet"
});
}

// only winner can pay
if (auction.winner.toString() !== req.user._id.toString()) {
return res.status(403).json({
message: "Only winner can pay"
});
}

// already paid
if (auction.paymentStatus === "paid") {
return res.status(400).json({
message: "Already paid"
});
}

auction.paymentStatus = "paid";

await auction.save();

res.json({
message: "Payment successful",
auction
});

} catch (error) {
res.status(500).json({ error: error.message });
}
};