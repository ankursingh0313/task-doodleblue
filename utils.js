const bcrypt = require('bcryptjs');

async function cryptPassword(myPlaintextPassword) {
    try {
        let hash = await bcrypt.hash(myPlaintextPassword, 10);
        console.log(hash);
        return hash;
    } catch (error) {
        console.log("Error in <cryptPassword>: ", error.message);
        return undefined;
    }
};

async function comparePassword(myPlaintextPassword, hash) {
    try {
        let result = await bcrypt.compare(myPlaintextPassword, hash);
        console.log(result, myPlaintextPassword, hash);
        if (result) {
            console.log("hi");
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.log("Error in <comparePassword>: ", error.message);
        return false;
    }
};

function validateEmail(email) {
    if (email == undefined)
        return false;
    else if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
        return true;
    } else
        return false;
}
// password between 6 to 20 characters which contain at least one numeric digit, one uppercase and one lowercase letter
function validatePassword(password) {
    if (password == undefined)
        return false;
    else {
        var passw = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;
        if (password.match(passw)) {
            return true;
        } else
            return false;
    }
}

module.exports = {
    cryptPassword,
    comparePassword,
    validateEmail,
    validatePassword
}