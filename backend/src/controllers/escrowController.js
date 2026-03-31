const Auction = require("../models/Auction");


// Seller ships item
exports.shipItem = async (req, res) => {
try {

const auction = await Auction.findById(req.params.id);

if (auction.seller.toString() !== req.user._id.toString()) {
return res.status(403).json({
message: "Only seller can ship"
});
}

auction.deliveryStatus = "shipped";

await auction.save();

res.json({
message: "Item shipped",
auction
});

} catch (error) {
res.status(500).json({ error: error.message });
}
};


// Buyer confirms delivery
exports.confirmDelivery = async (req, res) => {
try {

const auction = await Auction.findById(req.params.id);

if (auction.winner.toString() !== req.user._id.toString()) {
return res.status(403).json({
message: "Only winner can confirm"
});
}

auction.deliveryStatus = "delivered";
auction.paymentStatus = "released";

await auction.save();

res.json({
message: "Payment released to seller",
auction
});

} catch (error) {
res.status(500).json({ error: error.message });
}
};


// Open dispute
exports.openDispute = async (req, res) => {
try {

const auction = await Auction.findById(req.params.id);

auction.dispute = true;

await auction.save();

res.json({
message: "Dispute opened",
auction
});

} catch (error) {
res.status(500).json({ error: error.message });
}
};


// Refund buyer
exports.refundBuyer = async (req, res) => {
try {

const auction = await Auction.findById(req.params.id);

auction.paymentStatus = "refunded";

await auction.save();

res.json({
message: "Buyer refunded",
auction
});

} catch (error) {
res.status(500).json({ error: error.message });
}
};