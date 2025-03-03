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
        console.log("User ID from token:", req.user?.id);

        if (!req.user || !req.user.id) {
          return res
            .status(401)
            .json({ message: "Unauthorized: No user ID found" });
        }

        const user = await userModel.findById(req.user.id).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


module.exports = {
    getUserById,
    getUserProfile
}