const notificationModel = require("../models/Notification");
const { getIo } = require("../utils/socket");

const sendNotification = async (userId, message) => {
  try {
    const notification = new notificationModel({
      user: userId,
      message,
    });
    await notification.save();

    const io = getIo();
    io.to(userId.toString()).emit("notification", notification);
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};

module.exports = { sendNotification };
