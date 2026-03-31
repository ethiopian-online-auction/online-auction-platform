const Auction = require("../models/Auction");
const Bid = require("../models/Bid");


// Create Auction
exports.createAuction = async (req, res) => {
try {

const auction = await Auction.create({
...req.body,
seller: req.user._id,
currentBid: req.body.startingPrice
});

res.status(201).json(auction);

} catch (error) {
res.status(500).json({ error: error.message });
}
};


// Get all auctions
exports.getAuctions = async (req, res) => {
try {

const auctions = await Auction
.find()
.populate("seller", "name email");

res.json(auctions);

} catch (error) {
res.status(500).json({ error: error.message });
}
};


// Get single auction with bids
exports.getAuction = async (req, res) => {
try {

const auction = await Auction
.findById(req.params.id)
.populate("seller", "name email");

if (!auction) {
return res.status(404).json({
message: "Auction not found"
});
}

const bids = await Bid
.find({ auction: req.params.id })
.sort({ amount: -1 })
.populate("bidder", "name email");

res.json({
auction,
bids
});

} catch (error) {
res.status(500).json({ error: error.message });
}
};