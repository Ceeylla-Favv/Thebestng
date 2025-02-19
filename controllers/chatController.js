const Chat = require("../models/Chat");
const messageModel = require("../models/Message");
const Message = require("../models/Message");
const { getIo } = require("../utils/socket");
const { getBestFAQResponse } = require("./faqBotController");
require("dotenv").config();

const startChat = async (req, res) => {
  const { userId2 } = req.body;
  const userId1 = req.user._id;

  if (!userId2)
    return res.status(400).json({ error: "Receiver ID is required" });

  try {
    let chat = await Chat.findOne({
      participants: { $all: [userId1, userId2] },
    });

    if (!chat) {
      chat = new Chat({ participants: [userId1, userId2] });
      await chat.save();
    }

    return res.status(200).json({ chatId: chat._id, message: "Chat started" });
  } catch (error) {
    return res.status(500).json({ error: "Server error" });
  }
};

const sendMessage = async (req, res) => {
  const { chatId, message: messageText } = req.body;
  const senderId = req.user._id;

  if (!chatId || !messageText) {
    return res.status(400).json({ error: "Chat ID and message are required" });
  }

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    if (!chat.participants.includes(senderId)) {
      return res
        .status(403)
        .json({ error: "Unauthorized to send messages in this chat" });
    }

    let receiverId = null;
    let botResponse = null;
    const BOT_ID = process.env.BOT_ID;

    if (chat.isSupportChat) {
      if (!chat.assignedAgent) {
        botResponse = getBestFAQResponse(messageText);

        if (botResponse) {
          const botMessage = new messageModel({
            chat: chatId,
            sender: BOT_ID,
            receiver: senderId,
            message: botResponse,
            isBot: true,
          });

          await botMessage.save();
          chat.messages.push(botMessage._id);
          await chat.save();

          const updatedChat = await Chat.findById(chatId).populate("messages");

          return res.status(200).json(updatedChat);
        }

        chat.failedBotResponses = (chat.failedBotResponses || 0) + 1;
        await chat.save();

        if (chat.failedBotResponses >= 2) {
          chat.failedBotResponses = 0;
          await chat.save();
          
          return res.status(200).json({
            message:
              "We couldn't answer your query. Please contact support via WhatsApp.",
            whatsappLink: process.env.WHATSAPP_SUPPORT_LINK,
          });
        }
      }
      receiverId = chat.assignedAgent;
    } else {
      receiverId = req.body.receiverId;

      if (!receiverId) {
        return res.status(400).json({ error: "Receiver ID is required" });
      }
    }

    const newMessage = new Message({
      chat: chatId,
      sender: senderId,
      receiver: receiverId,
      message: messageText,
    });
    await newMessage.save();
    await Chat.findByIdAndUpdate(chatId, {
      $push: { messages: newMessage._id },
      updatedAt: Date.now(),
    });

    const io = getIo();
    chat.participants.forEach((participant) => {
      io.to(participant.toString()).emit("newMessage", newMessage);
    });

    return res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error in sendMessage:", error);
    return res
      .status(500)
      .json({ error: "Server error", details: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;

    if (!chatId) {
      return res.status(400).json({ error: "Chat ID is required" });
    }

    const messages = await Message.find({ chat: chatId })
      .populate({
        path: "sender receiver",
        select: "username",
      })
      .select("message sender receiver isRead createdAt")
      .sort({ createdAt: 1 });

    return res.status(200).json(messages);
  } catch (error) {
    return res.status(500).json({ error: "Server error" });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    if (!chat.participants.includes(userId)) {
      return res
        .status(403)
        .json({ error: "Unauthorized: You are not part of this chat" });
    }

    const unreadMessages = await Message.find({
      chat: chatId,
      receiver: userId,
      isRead: false,
    });

    if (unreadMessages.length === 0) {
      return res
        .status(400)
        .json({ error: "No unread messages for you in this chat" });
    }

    const updateResult = await Message.updateMany(
      { chat: chatId, receiver: userId, isRead: false },
      { $set: { isRead: true } }
    );

    const updatedMessages = await Message.find({
      chat: chatId,
      receiver: userId,
      isRead: true,
    }).select("_id isRead");

    const io = getIo();
    chat.participants.forEach((participant) => {
      if (participant.toString() !== userId.toString()) {
        io.to(participant.toString()).emit(`chat:${chatId}`, {
          type: "read",
        });
      }
    });

    return res.status(200).json({
      message: `${updateResult.modifiedCount} messages marked as read`,
      updatedMessages,
    });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

module.exports = { startChat, sendMessage, getMessages, markAsRead };
