const jwt = require("jsonwebtoken");
const userModel = require("../models/User");
require("dotenv").config();

const isLoggedIn = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.jwt_secret);
      req.user = await userModel.findById(decoded.userId);
      if (!req.user) {
        return res.status(401).json({ error: "Invalid token" });
      }
    } catch (error) {
      console.log(error.message);
      return res
        .status(403)
        .json({ error: "token is missing from the header" });
    }
  }
  if (!token) {
    return res.status(401).json({ error: "token is missing from the header" });
  }

  next();
};

const isClient = async (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.jwt_secret);
    const user = await userModel.findById(decoded.userId);

    if (!user || user.role !== "client") {
      return res.status(403).json({ message: "Forbidden: Client only" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: "Invalid token" });
  }
};


module.exports = { isLoggedIn, isClient};