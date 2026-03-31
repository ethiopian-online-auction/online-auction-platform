const Auction = require("../models/Auction");
const Bid = require("../models/Bid");

const autoEndAuctions = async () => {
try {

const now = new Date();

const auctions = await Auction.find({
endTime: { $lte: now },
status: { $ne: "ended" }
});

for (let auction of auctions) {

const highestBid = await Bid
.findOne({ auction: auction._id })
.sort({ amount: -1 });

if (highestBid) {
auction.winner = highestBid.bidder;
auction.currentBid = highestBid.amount;
}

auction.status = "ended";
await auction.save();

console.log("Auction ended:", auction._id);
}

} catch (error) {
console.log(error);
}
};

module.exports = autoEndAuctions;