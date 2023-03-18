require('dotenv').config();
require('./config/database').connect();
const nodemailer = require('nodemailer');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const otpGenerator = require('otp-generator')


// const User = require('./model/user');
const {User, Token} = require("./model")
const auth = require('./middleware/auth');
const cors = require('cors');
const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(cors());



const  details = {
  service:"gmail",
  auth:{
      user:"ramiz.pcsglobal@gmail.com",
      pass:"dqcuuzueakbazgce"
  },
}
const transporter = nodemailer.createTransport(details)




app.post('/register', async (req, res) => {
  try {
    // console.log("called")
    // Get user input
    const { userType, name, email, mobile, password, status } =
      req.body;

      // console.log(req.body)

    // Validate user input
    if (!(email && password && name)) {
      res.status(400).send('All input is required');
    }

    // check if user already exist
    // Validate if user exist in our database
    const oldUser = await User.findOne({ email:email });

    if (oldUser) {
      return res.status(409).send('User Already Exist. Please Login');
    }

    //Encrypt user password
    const encryptedPassword = await bcrypt.hash(password, 10);

    // Create user in our database
    const otp = otpGenerator.generate(6, {  
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false, });
    const user = await User.create({
      // userId,
      userType:userType,
      name:name,
      email: email.toLowerCase().trim(), // sanitize: convert email to lowercase
      mobile:mobile,
      password: encryptedPassword
    });

    // Create token


  

    const expires = moment().add("10", 'minutes');
    
    const payload = {
      sub: user._id,
      iat: moment().unix(),
      exp: expires.unix(),
      type:"mailVerification"
  };
  const token = jwt.sign(payload, process.env.TOKEN_KEY);
  // console.log(token);

  await Token.create({
    userId: user._id,
    token:token,
    type:"mailVerification",
    otp:otp,
    email: email.toLowerCase().trim()
  })

  const mailData = { 
    from:"ramiz.pcsglobal@gmail.com",
    to:email.toLowerCase().trim(),
    subject:"VeriFy Your Email",
    text:``,
    html:`<h1>Your mail varification OTP is <span style="color:red;" > ${otp} </span></h1>`
  }
  
  transporter.sendMail(mailData,(err,data)=>{
    try{
      if(err){
        console.log("reject:",err)
    }else{ 
        console.log("success")
    }
    }catch(e){
      console.log(e)
    }
  })
  
    res.status(201).json({success: true, user});
  } catch (err) {
    res.status(400).json({success: false});
  }
});

app.post('/login', async (req, res) => {
  try {
    // Get user input
    const { email, password } = req.body;

    // Validate user input
    if (!(email && password)) {
      res.status(400).send('All input is required');
    }
    // Validate if user exist in our database


    const user = await User.findOne({ email:email, isMailVerified: true });




    if (user && (await bcrypt.compare(password, user.password))) {
      const expires = moment().add("30", 'days');
    
      const payload = {
        sub: user._id,
        iat: moment().unix(),
        exp: expires.unix(),
        type:"refresh"
        };
    const token = jwt.sign(payload, process.env.TOKEN_KEY);

      const refresh = await Token.findOneAndUpdate({
        email:email
      },{
        token: token,
        type: "refresh"
      })
      res.status(200).json({success: true,user, token: refresh});
    }else{
      res.status(400).send('Invalid Credentials');
    }
    
  } catch (err) {
    res.status(400).send(err);
  }
});

app.post("/verify", async (req, res) => {

  try {

    let tokenDoc = await Token.findOne({otp: req.body.otp})
    if(!tokenDoc) 
        return res.status(400).send('Wrong otp');
  
    let user = await User.findOneAndUpdate({
      email:tokenDoc.email 
    },{
      isMailVerified: true
    })

    res.status(200).json({success: true, user});
    
  } catch (error) {
    res.status(400).send(error);
  }
 


})


app.post("/userType", async (req, res) => {
  try{
    // console.log("called")
  const user = await User.findById(req.body.userId)
  res.status(200).json({success: true, user});
  }catch (error) {
    res.status(400).send(error);
  }
})

app.post("/forget-password",async (req, res) => {

  try{
  await Token.deleteMany({
    email: req.body.email
  })

  const user =await User.findOne({
    email: req.body.email
  })

  const expires = moment().add("10", 'minutes');
    
    const payload = {
      sub: user._id,
      iat: moment().unix(),
      exp: expires.unix(),
      type:"resetPasswordToken"
  };
  const token = jwt.sign(payload, process.env.TOKEN_KEY);

  const otp = otpGenerator.generate(6, {  
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false, });

  const forgetToken = await Token.create({
    userId: user._id,
    token: token,
    type: "resetPasswordToken",
    otp: otp,
    email: req.body.email
  })

  const mailData = { 
    from:"ramiz.pcsglobal@gmail.com",
    to:email.toLowerCase().trim(),
    subject:"VeriFy Your Email",
    text:``,
    html:`<h1>Your reset mail varification OTP is <span style="color:red;" > ${otp} </span></h1>`
  }
  
  transporter.sendMail(mailData,(err,data)=>{
    try{
      if(err){
        console.log("reject:",err)
    }else{ 
        console.log("success")
    }
    }catch(e){
      console.log(e)
    }
  })


  res.status(201).json({success: true, user});

}catch(error){
  res.status(400).json({success: false});
}

})




app.use('*', (req, res) => {
  res.status(404).json({
    success: 'false',
    message: 'Page not found',
    error: {
      statusCode: 404,
      message: 'You reached a route that is not defined on this server',
    },
  });
});

module.exports = app;
