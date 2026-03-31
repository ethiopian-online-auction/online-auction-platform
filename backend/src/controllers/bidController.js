const Bid = require("../models/Bid");
const Auction = require("../models/Auction");


// Place bid
exports.placeBid = async (req, res) => {
try {

const { amount } = req.body;
const auctionId = req.params.id;

const auction = await Auction.findById(auctionId);

if (!auction) {
return res.status(404).json({ message: "Auction not found" });
}

// prevent seller bidding
if (auction.seller.toString() === req.user._id.toString()) {
return res.status(400).json({
message: "Seller cannot bid on own auction"
});
}

// check bid amount
if (amount <= auction.currentBid) {
return res.status(400).json({
message: "Bid must be higher than current bid"
});
}

// create bid
const bid = await Bid.create({
auction: auctionId,
bidder: req.user._id,
amount
});

// update auction
auction.currentBid = amount;
await auction.save();

res.status(201).json({
message: "Bid placed",
bid
});

} catch (error) {
res.status(500).json({ error: error.message });
}
};