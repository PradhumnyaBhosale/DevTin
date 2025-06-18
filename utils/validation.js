const validator = require('validator');



const valid= (req)=> {
    const {firstName,lastName,email,password} = req.body;

    if(!firstName || !lastName || !email || !password) {
        return {status: false, message: "All fields are required"};
    }
    else if(!validator.isEmail(email)) {
        return {status: false, message: "Invalid email format"};
    }
    else if(!validator.isStrongPassword(password, { minLength: 6 })) {
        return {status: false, message: "Password must be at least 6 characters long"};
    }
    else {
        return {status: true, message: "Validation successful"};
    }


}
module.exports = {
    valid
};