const mongoose = require("mongoose");

const auctionSchema = new mongoose.Schema(
{
  title: String,
  description: String,
  image: String,

  startingPrice: Number,
  currentPrice: Number,

  startTime: Date,
  endTime: Date,

  status: {
    type: String,
    enum: ["active", "ended"],
    default: "active"
  },

  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
},
{ timestamps: true }
);

module.exports = mongoose.model("Auction", auctionSchema);