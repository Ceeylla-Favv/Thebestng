const mongoose = require('mongoose');
const taskModel = require("../models/Task");


const getSingleTask = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid task ID" });
    }

    let task;


    task = await taskModel
      .findById(req.params.id)
      .populate("client", "username");

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    let applicantsCount;

    if (task.client._id.toString() === req.user._id.toString()) {
      task = await task.populate("appliedTaskers", "username");
    } else if(task.client._id.toString() != req.user._id.toString()) {
      applicantsCount = task.appliedTaskers.length;
      task = await taskModel
        .findById(req.params.id)
        .select("-appliedTaskers -designatedTasker");
    }

    return res.status(200).json({
      task,
      applicantsCount: applicantsCount || undefined,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
};



const getAllTasks = async (req, res) => {
  try {
    const tasks = await taskModel
      .find()
      .populate("client", "username")
      .sort({ createdAt: -1 });

    const tasksWithApplicantsCount = [];

    for (let task of tasks) {
      let applicantsCount;

      if (task.client.toString() === req.user._id.toString()) {
        await task.populate("appliedTaskers", "username");
      } else {
        applicantsCount = task.appliedTaskers.length;
      }

     
      tasksWithApplicantsCount.push({
        task: task,
        applicantsCount: applicantsCount || undefined, 
      });
    }

    return res.status(200).json(tasksWithApplicantsCount);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
};



const applyForTask = async (req, res) => {
  try {
    const task = await taskModel.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    if (task.appliedTaskers.includes(req.user._id)) {
      return res
        .status(400)
        .json({ error: "You have already applied for this task" });
    }

    task.appliedTaskers.push(req.user._id);
    await task.save();

    return res
      .status(200)
      .json({ message: "Task application successful", task });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "server error" });
  }
};

const completeTask = async (req, res) => {
  try {
    const task = await taskModel.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    if (req.user._id.toString() !== task.designatedTasker.toString()) {
      return res
        .status(403)
        .json({ error: "Unauthorized to complete this task" });
    }

    task.status = "completed";
    await task.save();

    return res.status(200).json({ message: "Task marked as completed", task });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
};

module.exports = { getSingleTask, getAllTasks, applyForTask, completeTask };
