import express from 'express'
import chats from '../data/data.js'
const router=express.Router()
import User from '../models/userModel.js'
import { ReigsterHandler ,LoginHandler,searchUsers } from '../controllers/userController.js'
import upload from '../middleware/uploadMiddleware.js'
import protect from '../middleware/authMiddleware.js'

router.post("/register",upload.single("profileImage"),ReigsterHandler)
router.post("/login",LoginHandler)
router.get("/",protect,searchUsers)

export default router;