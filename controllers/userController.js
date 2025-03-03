const userModel = require("../models/User")


const getUserById = async (req, res) => {
    try {
        const user = await userModel.findById(req.params.id).select("-password");

        if(!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message});
    }
    
};

const getUserProfile = async (req, res) => {
    try {
        const user = await userModel.findById(req.user.id).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const updates = req.body;

        const restrictedFields = [
          "password",
          "email",
          "role",
          "resetToken",
          "resetExpires",
        ];
        restrictedFields.forEach((field) => delete updates[field]);

        const updatedUser = await userModel.findByIdAndUpdate(userId, updates, {
            new: true,
            runValidators: true,
        }).select("-password");

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

module.exports = {
    getUserById,
    getUserProfile,
    updateUserProfile
}