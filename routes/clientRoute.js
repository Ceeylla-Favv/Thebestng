const express = require("express");
const { isLoggedIn, isClient } = require("../middleware/authenticate");
const upload = require("../middleware/multerConfig");
const {
  createTask,
  updateTask,
  deleteTask,
  assignTasker,
  approveTask,
  submitReview,
} = require("../controllers/clientController");

const router = express.Router();

router.route("/create-task").post(isLoggedIn,
  isClient,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "document", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  createTask
);

router.route("/update-task/:id").patch(
  isLoggedIn,
  isClient,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "document", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  updateTask
);
router.route("/delete-task/:id").delete(isLoggedIn, isClient, deleteTask);
router.route("/:taskId/assign/:taskerId").patch(isLoggedIn, isClient, assignTasker);
router.route("/:taskId/approve").patch(isLoggedIn, isClient, approveTask);
router.route("/review").post(isLoggedIn, submitReview);

module.exports = router;
