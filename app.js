const express = require("express");
connection = require("./config/database");
const User = require("./models/user");
const {valid} = require("./utils/validation");
const cookieParser = require('cookie-parser');

const bcrypt = require("bcrypt");
const app = express();
app.use(express.json()); 
app.use(cookieParser());



app.post("/signup", async (req, res) => {
  
  try {
    console.log("Starting user creation process...");
    // Create new user instance
    const {
      firstName,lastName,email,password,gender,age
    }= req.body;
    const hashed = bcrypt.hashSync(password, 10);

    valid(req);
    const user = new User({
      firstName,lastName,email,password:hashed,gender,age
    });

    // Save the user
    const savedUser = await user.save();
    console.log("User saved successfully:", savedUser);

    // Send success response
    return res.status(201).json({
      success: true,
      message: "User created successfully",
      user: savedUser,
    });
  } catch (error) {
    console.error("Error in signup:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create user",
      error: error.message,
    });
  }
});



app.post('/login',async(req,res)=>{
  try{
    const {email,password} = req.body;
    if(!email || !password){
      return res.status(400).json({
        success:false,
        message:"Email and password are required"
      })
    }
    const user = await User.findOne({email});
    if(!user){
      return res.status(404).json({
        success:false,
        message:"User not found"
      })
    }
    const isMatch = bcrypt.compareSync(password,user.password);
    if(!isMatch){
      return res.status(401).json({
        success:false,
        message:"Invalid credentials"
      })
    }
    return res.status(200).json({
      success:true,
      message:"Login successful",
      user:user
    })
  }
  catch(err){
    console.log(err);
    res.status(500).json({
      success:false,
      message:"Failed to login",
      error:err.message
    })
  }
}
);



app.get("/users", async (req, res) => {
  const  cookies = req.cookies;
   
  
  try {
    const email = req.body.email;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    console.log(user);
    return res.status(200).json({
      success: true,
      user: user,
    });
  } catch (error) {
    console.error("Error in getting user:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get user",
      error: error.message,
    });
  }
});



app.delete('/user',async(req,res)=>{
  try{
    const id = req.body.id;
    const user = await User.findByIdAndDelete({_id:id});
    res.send(user);
  }
  catch(err){
    console.log(err);
    res.status(404).json({
      success:false,
      message:"Failed to delete user",
      error:err.message
    })
  }
})


app.patch('/user',async(req,res)=>{
  try{
    const id = req.body.id;
    const user = await User.findByIdAndUpdate({_id:id},req.body,{returnDocument:'after'});
    res.send(user);
  }
  catch(err){
    console.log(err);
    res.status(404).json({
      success:false,
      message:"Failed to update user",
      error:err.message
    })
  }

}
   
)



 app.get("/feed",async(req,res)=>{
      try{
        const user = await User.find({});
        res.send(user);
      } 
      catch(err){
           console.log(err);
           res.status(404).json({
            success:false,
            message:"Failed to get user",
            error:err.message

           })
      } 
 
 })


connection()
  .then(() => {
    console.log("Database connected successfully");
    app.listen(3000, () => {
      console.log("Server running on Port 3000");
    });
  })
  .catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
