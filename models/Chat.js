const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const chatSchema = new Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    messages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
      },
    ],
    isSupportChat: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["open", "in-progress", "resolved"],
      default: "open",
    },
    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    failedBotResponses: { type: Number, default: 0 },
    botFeedback: [String],
  },
  {
    timestamps: true,
  }
);

const chatModel = model("Chat", chatSchema);

module.exports = chatModel;
