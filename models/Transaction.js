const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const transactionSchema = new Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["credit", "debit"], required: true },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "failed"],
      default: "pending",
    },
    reference: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const transactionModel = model("Transaction", transactionSchema);

module.exports = transactionModel;
