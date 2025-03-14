const express = require("express");
const { getUserById, getUserProfile, updateUserProfile } = require("../controllers/userController");
const { isLoggedIn } = require("../middleware/authenticate");
const router = express.Router();

router.route("/profile").get(isLoggedIn, getUserProfile);
router.route("/:id").get(getUserById);
router.route("/profile").patch(isLoggedIn, updateUserProfile);


module.exports = router;
