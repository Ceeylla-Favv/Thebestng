const mongoose = require("mongoose");
const dotenv = require('dotenv');
dotenv.config();

const connectString = process.env.connectString;
async function connectDb() {
    await mongoose.connect(connectString);
    console.log("Database connected");
}

module.exports = connectDb;