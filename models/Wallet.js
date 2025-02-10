const mongoose = require('mongoose');
const { Schema, model} = mongoose;

const walletSchema =new Schema({
    user: { type: mongoose.Types.ObjectId, ref: 'User', required: true},
    balance: { type: Number, required: true }

});

const walletModel = model('Wallet', walletSchema);

module.exports = walletModel;