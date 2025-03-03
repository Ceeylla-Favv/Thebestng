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


module.exports = {
    getUserById
}