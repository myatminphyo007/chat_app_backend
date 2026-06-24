import asyncHandler from "express-async-handler";
import Chat from "../models/chatModel.js";
import User from "../models/userModel.js";
import Message from "../models/messageModel.js";

const chatAccess = asyncHandler(async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        res.status(400);
        throw new Error("User ID param not sent");
    }

    let isChat = await Chat.find({
        isGroupChat: false,
        $and: [
            { users: { $elemMatch: { $eq: userId } } },
            { users: { $elemMatch: { $eq: req.user._id } } },
        ],
    })
        .populate("users", "-password")
        .populate("latestMessage");

    isChat = await User.populate(isChat, {
        path: "latestMessage.sender",
        select: "name email pic",
    });

    if (isChat.length > 0) {
        res.status(200).json(isChat[0]);
    } else {
        try {
            const createdChat = await Chat.create({
                chatName: "sender",
                isGroupChat: false,
                users: [req.user._id, userId],
            });

            const fullChat = await Chat.findById(createdChat._id)
                .populate("users", "-password")
                .populate("latestMessage");

            res.status(200).json(fullChat);
        } catch (err) {
            throw new Error(`Error creating chat: ${err.message}`);
        }
    }
});

const fetchChats = asyncHandler(async (req, res) => {
    try {
        let chats = await Chat.find({
            users: { $elemMatch: { $eq: req.user._id } }
        })
        .populate("users", "-password")
        .populate("latestMessage")
        .populate("groupAdmin", "-password")
        .sort({ updatedAt: -1 })

        chats = await User.populate(chats, {
            path: "latestMessage.sender",
            select: "name email profileImage",
        })

        res.status(200).json(chats)

    } catch (err) {
        throw new Error(`Error fetching chats: ${err.message}`)
    }
})

const createGroupChat = asyncHandler(async (req, res) => {
    if (!req.body.users || !req.body.name) {
        return res.status(400).json({ message: "Please fill all the fields" })
    }

    let users = JSON.parse(req.body.users)

    if (users.length < 2) {
        return res.status(400).json({ message: "Group needs more than 2 users" })
    }

    users.push(req.user)

    const groupChat = await Chat.create({
        chatName: req.body.name,
        users: users,
        isGroupChat: true,
        groupAdmin: req.user
    })

    const fullGroupChat = await Chat.findById(groupChat._id)
        .populate("users", "-password")
        .populate("groupAdmin", "-password")
        .populate("latestMessage")

    const fullGpChat = await User.populate(fullGroupChat, {
        path: "latestMessage.sender",
        select: "name email profileImage",
    })

    res.status(201).json(fullGpChat)
})

const renameGroup = asyncHandler(async (req, res) => {
    const { chatId, chatName } = req.body

    const updatedGroupChat = await Chat.findByIdAndUpdate(
        chatId,
        { chatName },
        { new: true }
    )
    .populate("users", "-password")
    .populate("groupAdmin", "-password")
    .populate("latestMessage")

    if (!updatedGroupChat) {
        res.status(404)
        throw new Error("Chat not found")
    }

    res.status(200).json(updatedGroupChat)
})

const addToGroup = asyncHandler(async (req, res) => {
    const { chatId, userId } = req.body

    const added = await Chat.findByIdAndUpdate(
        chatId,
        { $push: { users: userId } },
        { new: true }
    )
    .populate("users", "-password")
    .populate("groupAdmin", "-password")
    .populate("latestMessage")

    if (!added) {
        res.status(404)
        throw new Error("Chat not found")
    }

    res.status(200).json(added)
})

const removeFromGroup = asyncHandler(async (req, res) => {
    const { chatId, userId } = req.body

    const removed = await Chat.findByIdAndUpdate(
        chatId,
        { $pull: { users: userId } },
        { new: true }
    )
    .populate("users", "-password")
    .populate("groupAdmin", "-password")
    .populate("latestMessage")

    if (!removed) {
        res.status(404)
        throw new Error("Chat not found")
    }

    res.status(200).json(removed)
})

// *** NEW - delete 1-on-1 chat (any member can delete) ***
const deleteChat = asyncHandler(async (req, res) => {
    const chat = await Chat.findById(req.params.chatId)

    if (!chat) {
        res.status(404)
        throw new Error("Chat not found")
    }

    // check if user is a member of this chat
    if (!chat.users.includes(req.user._id)) {
        res.status(403)
        throw new Error("Not allowed to delete this chat")
    }

    // delete all messages in this chat too
    await Message.deleteMany({ chat: req.params.chatId })

    await Chat.findByIdAndDelete(req.params.chatId)

    res.status(200).json({ message: "Chat deleted" })
})

// *** NEW - delete group chat (only admin can delete) ***
const deleteGroupChat = asyncHandler(async (req, res) => {
    const chat = await Chat.findById(req.params.chatId)

    if (!chat) {
        res.status(404)
        throw new Error("Chat not found")
    }

    // only group admin can delete
    if (chat.groupAdmin.toString() !== req.user._id.toString()) {
        res.status(403)
        throw new Error("Only admin can delete this group")
    }

    // delete all messages in this group too
    await Message.deleteMany({ chat: req.params.chatId })

    await Chat.findByIdAndDelete(req.params.chatId)

    res.status(200).json({ message: "Group deleted" })
})

export {
    chatAccess, fetchChats, createGroupChat,
    renameGroup, addToGroup, removeFromGroup,
    deleteChat, deleteGroupChat
}