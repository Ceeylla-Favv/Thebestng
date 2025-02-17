const chatModel = require("../models/Chat");
const userModel = require("../models/User");


const startSupportChat = async (req, res) => {
  const userId = req.user._id;

  try {
    let chat = await chatModel.findOne({
      participants: [userId],
      isSupportChat: true,
      status: { $ne: "resolved" },
    });

    if (chat) {
      return res
        .status(200)
        .json({ chatId: chat._id, message: "Chat already exists" });
    }

    chat = new chatModel({
      participants: [userId],
      isSupportChat: true,
      assignedAgent: null,
      failedBotResponses: 0,
    });

    await chat.save();

    return res.status(201).json({
      chatId: chat._id,
      message: "Support chat started, bot is assisting you.",
    });
  } catch (error) {
    return res.status(500).json({ error: "Server error" });
  }
};

const assignAgent = async (req, res) => {
  const { chatId } = req.params;

  try {
    const chat = await chatModel.findById(chatId);

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    if (chat.assignedAgent) {
      return res.status(404).json({ error: "Agent already assigned" });
    }

    const availableAgent = await userModel.findOne({ role: "admin" });
    if (!availableAgent) {
      return res.status(404).json({ error: "No available support agent" });
    }

    chat.assignedAgent = availableAgent._id;
    chat.participants.push(availableAgent._id);
    chat.status = "in-progress";
    await chat.save();

    return res
      .status(200)
      .json({ message: "Agent assigned", agent: availableAgent.username });
  } catch (error) {
    console.error("Error assigning agent:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

const updateChatStatus = async (req, res) => {
  const { chatId } = req.params;
  const { status } = req.body;

  if (!["open", "in-progress", "resolved"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    const chat = await chatModel.findByIdAndUpdate(
      chatId,
      { status },
      { new: true }
    );

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    return res.status(200).json({ message: "Chat status updated", chat });
  } catch (error) {
    return res.status(500).json({ error: "Server error" });
  }
};

module.exports = { startSupportChat, assignAgent, updateChatStatus };
