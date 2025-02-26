const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const referralSchema = new Schema({
  user: { type: mongoose.Types.ObjectId, ref: "User", required: true },
  referrer: { type: Schema.Types.ObjectId, ref: "User" },
  referralCode: { type: String, required: true },
});

const referralModel = model("Referral", referralSchema);

module.exports = referralModel;
