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

seller: {
type: mongoose.Schema.Types.ObjectId,
ref: "User",
required: true
},

startTime: {
type: Date,
required: true
},

endTime: {
type: Date,
required: true
},

status: {
type: String,
enum: ["pending", "active", "ended"],
default: "pending"
},

paymentStatus: {
type: String,
enum: ["pending", "paid", "released", "refunded"],
default: "pending"
},

deliveryStatus: {
type: String,
enum: ["pending", "shipped", "delivered"],
default: "pending"
},

dispute: {
type: Boolean,
default: false
}

},
{ timestamps: true }
);

module.exports = mongoose.model("Auction", auctionSchema);