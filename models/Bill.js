const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  name: String,
  quantity: Number,
  price: Number,
});

const BillSchema = new mongoose.Schema({
  serial: { type: Number, unique: true },
  billerName: String,
  billerNumber: String,
  billToAddress: String,
  billToCity: String,
  products: [ProductSchema],
  totalAmount: Number,
  date: { type: Date, default: Date.now },
  pdfPath: String,
});

module.exports = mongoose.model("Bill", BillSchema);
