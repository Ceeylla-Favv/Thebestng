const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const taskSchema = new Schema(
  {
    title: { type: String, required: true },
    mustHave: { type: [String] },
    description: { type: String },
    location: { type: String },
    pricing: { type: Number, required: true },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ["active", "in-progress", "cancelled", "completed"],
      default: "active",
    },
    media: {
      photo: { type: String },
      document: { type: String },
      video: { type: String },
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    appliedTaskers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    designatedTasker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },
    deletedAt: {
      type: Date
    }
  },
  {
    timestamps: true,
  }
);

const taskModel = model("Task", taskSchema);

module.exports = taskModel;
