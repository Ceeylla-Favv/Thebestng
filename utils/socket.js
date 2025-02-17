const { Server } = require("socket.io");
const Message = require("../models/Message");
const Chat = require("../models/Chat");

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("joinRoom", (room) => {
      if (!room) return;
      console.log(`User ${socket.id} joined room: ${room}`);
      socket.join(room);
    });

    socket.on("sendMessage", async (data) => {
      const { room, message, senderId } = data;

      if (!room || !message || !senderId) {
        console.warn(`Invalid message data:`, data);
        return;
      }

      if (!io.sockets.adapter.rooms.get(room)) {
        console.warn(`Room ${room} does not exist.`);
        return;
      }

      console.log(`Message sent to ${room}:`, message);
      io.to(room).emit("newMessage", { room, message, senderId });
    });

    socket.on("markAsRead", async (data) => {
      const { chatId, userId } = data;

      if (!chatId || !userId) {
        console.warn(`Invalid markAsRead request`, data);
        return;
      }

      await Message.updateMany(
        { chat: chatId, receiver: userId, isRead: false },
        { $set: { isRead: true } }
      );

      io.to(chatId).emit("chatRead", { chatId, userId });
    });

    socket.on("assignAgent", async (data) => {
      const { chatId, agentId } = data;

      if (!chatId || !agentId) {
        console.warn(`Invalid assignAgent request`, data);
        return;
      }

      await Chat.findByIdAndUpdate(chatId, { assignedAgent: agentId });

      io.to(chatId).emit("agentAssigned", { chatId, agentId });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};

const getIo = () => {
  if (!io) throw new Error("Socket.io is not initialized!");
  return io;
};

module.exports = { initializeSocket, getIo };
