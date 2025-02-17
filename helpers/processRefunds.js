const cron = require("node-cron");
const taskModel = require("../models/Task");
const walletModel = require("../models/Wallet");


const processRefunds = async () => {
  try {
    console.log("Running refund cron job at", new Date().toISOString());

    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const tasksToRefund = await taskModel.find({
      deletedAt: { $lte: twoDaysAgo },
    });

    for (const task of tasksToRefund) {
      const clientWallet = await walletModel.findOne({ user: task.client });

      if (clientWallet) {
        clientWallet.balance += task.pricing;
        await clientWallet.save();
        console.log(`Refunded ${task.pricing} to user ${task.client}`);
      }

      
      await task.deleteOne();
      console.log(`Deleted task ${task._id}`);
    }
  } catch (error) {
    console.error("Error processing refunds:", error);
  }
};


// cron.schedule("0 * * * *", processRefunds);
// cron.schedule("0 0 */2 * *", processRefunds); // Runs every 2 days at midnight
cron.schedule("*/15 * * * *", processRefunds); // Runs every 15 minutes

module.exports = processRefunds;
