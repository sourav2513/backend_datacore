const mongoose= require("mongoose");

// userId,userType,name, email,mobile, password,otp,status
const tokenSchema = new mongoose.Schema({ 
    userId: {
        type:mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    token:String,
    type:{
        type:String,
        enum:["mailVerification", "refresh", "resetPasswordToken"]
    },
    otp:String,
    email:String,
})

module.exports = mongoose.model("Token", tokenSchema);