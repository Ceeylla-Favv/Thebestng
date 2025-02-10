const express = require('express');
const { getSingleTask, getAllTasks, applyForTask, completeTask } = require('../controllers/taskerController');
const { isLoggedIn } = require('../middleware/authenticate');
const router = express.Router();

router.route("/get-task/:id").get(isLoggedIn, getSingleTask);
router.route("/get-tasks").get(isLoggedIn, getAllTasks);
router.route("/:taskId/apply").post(isLoggedIn,applyForTask);
router.route("/:taskId/complete").patch(isLoggedIn, completeTask);

module.exports = router;