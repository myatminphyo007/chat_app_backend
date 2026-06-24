import asyncHandler from "express-async-handler"
import Message from "../models/messageModel.js"
import Chat from "../models/chatModel.js"

const sendMessage=asyncHandler(async(req,res)=>{
    const {chatId,content}=req.body

    if(!chatId || !content){
        res.status(400)
        throw new Error("Please fill something")
    }
    const message=await Message.create({
        sender:req.user._id,
        content,
        chat:chatId
    })
    const fullMessage = await Message.findById(message._id)
        .populate("sender", "name profileImage")
        .populate("chat");

    await Chat.findByIdAndUpdate(chatId, { latestMessage: fullMessage });

    res.status(200).json(fullMessage)
})

const getMessages = asyncHandler(async (req, res) => {
    const messages = await Message.find({ chat: req.params.chatId })
        .populate("sender", "name profileImage")
        .populate("chat");

    res.status(200).json(messages);
});

export { sendMessage, getMessages };