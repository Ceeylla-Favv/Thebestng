const generateOtp = () => {
    const otpValue = Math.floor(100000 + Math.random() * 900000).toString();

    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + 10);

    return { value: otpValue, expiry: expiryTime };
};

module.exports = generateOtp;