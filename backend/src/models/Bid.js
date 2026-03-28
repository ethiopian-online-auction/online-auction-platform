const mongoose = require("mongoose");

const bidSchema = new mongoose.Schema(
{
  amount: Number,

  bidder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  auction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Auction"
  }
},
{ timestamps: true }
);

module.exports = mongoose.model("Bid", bidSchema);