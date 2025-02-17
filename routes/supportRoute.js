const express = require("express");
const { isLoggedIn } = require("../middleware/authenticate");
const { startSupportChat, assignAgent, updateChatStatus } = require("../controllers/chatSupportControlller");
const router = express.Router();

router.route("/start").post(isLoggedIn, startSupportChat);
router.route("/assign-agent/:chatId").put(isLoggedIn, assignAgent);
router.route("/update-status/:chatId").put(isLoggedIn, updateChatStatus);


module.exports = router;
