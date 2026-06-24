import bcrypt from "bcryptjs"
import asyncHandler from "express-async-handler"
import User from "../models/userModel.js"
import generateToken from "../utils/generateToken.js"

const ReigsterHandler=asyncHandler(async(req,res)=>{
    const {name,email,password}=req.body
    if(!name||!email||!password){
        res.status(400)
        throw new Error("Please add all fields")
    }
    const userExist = await User.findOne({email})
    if(userExist){
        res.status(400)
        throw new Error("User already exist")
    }
    const salt = await bcrypt.genSalt(10)
    const hashedPassword=await bcrypt.hash(password,salt)
    const profileImage=req.file? req.file.path:'';
    const user=await User.create({
        name,
        email,
        password:hashedPassword,
        profileImage
    })
    if(user){
        res.status(201).json({
            _id:user._id,
            name:user.name,
            email:user.email,
            profileImage:user.profileImage,
            token:generateToken(user._id)
        })
    }
    else{
        res.status(400)
        throw new Error("Invalid user data")
    }
})

const LoginHandler=asyncHandler(async(req,res)=>{
    const{email,password}=req.body
    if (!email || !password) {
        res.status(400)
        throw new Error("Please add all fields")
    }
    const user =await User.findOne({email})
    if(user && (await bcrypt.compare(password,user.password))){
        res.status(200).json({
            _id:user._id,
            name:user.name,
            email:user.email,
            profileImage:user.profileImage,
            token:generateToken(user._id)
        })
    }else {
        res.status(401)
        throw new Error("Invalid email or password")
    }
})


const searchUsers=asyncHandler(async(req,res)=>{
    const keyword=req.query.search?
    {
        $or:[
            {name:{$regex:req.query.search,$options:"i"}},
            {email:{$regex:req.query.search,$options:"i"}}
        ]
    }:
    {}
    const users=await User.find(keyword)
        .find({_id:{$ne:req.user._id}})
        .select("-password")
    
    res.status(200).json(users)
})

export {ReigsterHandler,LoginHandler,searchUsers}