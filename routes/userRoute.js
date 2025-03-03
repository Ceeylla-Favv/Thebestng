const express = require("express");
const { getUserById } = require("../controllers/userController");
const router = express.Router();

router.route("/:id").get(getUserById);

module.exports = router;
