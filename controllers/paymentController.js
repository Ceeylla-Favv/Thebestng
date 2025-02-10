const axios = require("axios");
const walletModel = require("../models/Wallet");
const transactionModel = require("../models/Transaction");

const supportedBanks = async (req, res) => {
  try {
    const response = await axios.get("https://api.paystack.co/bank", {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    });
    const banks = response.data.data;

    return res.status(200).json({
      status: "success",
      message: "Banks fetched successfully",
      banks,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching banks",
      error: error.message,
    });
  }
};

const resolveBanks = async (req, res) => {
  try {
    const { accountNumber, bankCode } = req.body;

    if (!accountNumber || !bankCode) {
      return res.status(400).json({
        status: "error",
        message: "Account Number and Bank code are required",
      });
    }

    const response = await axios.get(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    if (response.data.status) {
      const resolvedAccount = response.data.data;

      return res.status(200).json({
        status: "success",
        message: "Bank account resolved successfully",
        data: resolvedAccount,
      });
    } else {
      return res.status(400).json({
        status: "error",
        message: response.data.message || "Failed to resolve bank account",
      });
    }
  } catch (error) {
    console.error("Error resolving bank account:", error.message);

    return res.status(500).json({
      status: "error",
      message: "An error occurred while resolving the bank account",
      error: error.message,
    });
  }
};

const fundWallet = async (req, res) => {
  const { amount } = req.body;
  const userId = req.user._id;

  try {
    let wallet = await walletModel.findOne({ userId });

    if (!wallet) {
      wallet = await walletModel.create({
        userId,
        balance: 0,
      });
    }

    wallet.balance += amount;
    await wallet.save();

    await transactionModel.create({
      amount,
      userId,
      type: "credit",
      description: `wallet funded with N${amount}`,
      status: "completed",
      reference: `manual_${Date.now()}`,
    });

    return res
      .status(200)
      .json({ message: "wallet funded successfully", balance: wallet.balance });
  } catch (error) {
    console.error("Error funding wallet:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const withdrawalRequest = async (req, res) => {
  const { accountNumber, bankCode, amount } = req.body;
  const userId = req.user._id;

  try {
    const wallet = await walletModel.findOne({ user: userId });

    if (!wallet) {
      wallet = new walletModel({
        user: userId,
        balance: 0,
      });
    }

    await wallet.save();

    const userBalance = wallet.balance;

    if (!amount || !accountNumber || !bankCode) {
      return res.status(400).json({
        status: "error",
        message: "Missing required fields: amount, accountNumber, or bankCode",
      });
    }

    if (userBalance < amount) {
      return res.status(400).json({
        status: "error",
        message: "Insufficient funds!",
      });
    }

    const reference = `txn_${new Date().getTime()}`;

    const newTransaction = new transactionModel({
      amount,
      description: "Withdrawal",
      type: "debit",
      status: "Pending",
      userId: userId,
      reference,
    });

    await newTransaction.save();

    const verifyAccount = `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`;

    const verificationResponse = await axios.get(verifyAccount, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });

    if (!verificationResponse.data.status) {
      newTransaction.status = "failed";
      newTransaction.description =
        "Paystack withdrawal bank verification failed";

      await newTransaction.save();

      return res.status(400).json({
        status: "error",
        message: "Bank verification failed",
      });
    }

    const recipientData = {
      type: "nuban",
      name: verificationResponse.data.account_name,
      bank_code: bankCode,
      account_number: accountNumber,
      currency: "NGN",
    };

    const createTransferRecipient = await axios.post(
      `https://api.paystack.co/transferrecipient`,
      recipientData,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    if (!createTransferRecipient.data.status) {
      newTransaction.status = "failed";
      newTransaction.description =
        "Paystack withdrawal bank verification failed";

      await newTransaction.save();
      return res.status(400).json({
        status: "error",
        message: "Failed to create transfer recipient ",
      });
    }

    const recipientCode = createTransferRecipient.data.recipient_code;

    const transferData = {
      source: "balance",
      amount: amount * 100,
      reference,
      recipient: recipientCode,
      reason: "Funds withdrawal",
    };

    const transferResponse = await axios.post(
      `https://api.paystack.co/transfer`,
      transferData,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    if (!transferResponse.data.status) {
      newTransaction.status = "Failed";
      newTransaction.description =
        "Paystack withdrawal bank verification failed";
      await newTransaction.save();

      return res.status(400).json({
        status: "error",
        message: "Transfer could not be completed, please try again later.",
      });
    }

    wallet.balance = userBalance - amount;
    newTransaction.status = "Completed";

    await wallet.save();
    await newTransaction.save();

    return res.status(200).json({
      status: "success",
      message: "Withdrawal successfully processed",
      newBalance: wallet.balance,
    });
  } catch (error) {
    console.error("Error during withdrawal process:", error.message);
    return res.status(500).json({
      status: "error",
      message: `An error occurred during the withdrawal process: ${error.message}`,
    });
  }
};

const verifyTransaction = async (req, res) => {
  const { reference, description } = req.body;
  const userId = req.user._id;

  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    console.log("Paystack Response:", response.data);

    const paymentData = response.data;

    if (paymentData.status && paymentData.data.status === "success") {
      const amountPaid = paymentData.data.amount / 100;
      const transactionReference = paymentData.data.reference;

      const existingTransaction = await transactionModel.findOne({
        reference: transactionReference,
      });

      if (existingTransaction) {
        return res
          .status(400)
          .json({ message: "Transaction already processed" });
      }

      const newTransaction = new transactionModel({
        description,
        type: "credit",
        status: "completed",
        user: userId,
        amount: amountPaid,
        reference: transactionReference,
      });

      await newTransaction.save();

      const userWallet = await walletModel.findOne({ user: userId });

      if (!userWallet) {
        const userWallet = new walletModel({
          user: userId,
          balance: amountPaid,
        });

        await userWallet.save();
      } else {
        userWallet.balance += amountPaid;
        await userWallet.save();
      }

      return res.status(200).json({
        message: "Payment verified successfully",
        wallet: userWallet,
      });
    } else {
      return res.status(400).json({
        message: "Payment verification failed",
        error: paymentData.message || "Unknown error",
      });
    }
  } catch (error) {
    console.error(
      "Error verifying payment",
      error.response?.data || error.message
    );
    return res.status(500).json({
      status: "error",
      message: "An error occurred while verifying payment",
      error: error.message,
    });
  }
};

module.exports = {supportedBanks, resolveBanks, fundWallet, withdrawalRequest, verifyTransaction}