const mongoose = require("mongoose");

const auctionSchema = new mongoose.Schema(
{
title: {
type: String,
required: true
},

description: {
type: String,
required: true
},

image: String,

category: String,

startingPrice: {
type: Number,
required: true
},

currentBid: {
type: Number,
default: 0
},

winner: {
type: mongoose.Schema.Types.ObjectId,
ref: "User"
},

startTime: {
type: Date,
required: true
},

endTime: {
type: Date,
required: true
},

seller: {
type: mongoose.Schema.Types.ObjectId,
ref: "User",
required: true
},

status: {
type: String,
enum: ["pending", "active", "ended"],
default: "pending"
},

paymentStatus: {
type: String,
enum: ["pending", "paid"],
default: "pending"
}

},
{ timestamps: true }
);

module.exports = mongoose.model("Auction", auctionSchema);