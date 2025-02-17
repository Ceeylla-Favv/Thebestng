const express = require("express");
const { isLoggedIn } = require("../middleware/authenticate");
const { startChat, sendMessage, getMessages, markAsRead } = require("../controllers/chatController");
const router = express.Router();

router.route("/create").post(isLoggedIn, startChat);
router.route("/message").post(isLoggedIn, sendMessage);
router.route("/:chatId/messages").get(isLoggedIn, getMessages);
router.route("/:chatId/read").put(isLoggedIn, markAsRead);

module.exports = router;
