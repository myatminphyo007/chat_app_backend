import express from "express"
import protect from "../middleware/authMiddleware.js"
import {
    addToGroup, chatAccess, createGroupChat,
    fetchChats, removeFromGroup, renameGroup,
    deleteChat, deleteGroupChat
} from "../controllers/chatController.js"

const router = express.Router()

router.post("/", protect, chatAccess)
router.get("/", protect, fetchChats)
router.post("/group", protect, createGroupChat)
router.put("/rename", protect, renameGroup)
router.put("/groupadd", protect, addToGroup)
router.put("/groupremove", protect, removeFromGroup)
router.delete("/:chatId", protect, deleteChat)          
router.delete("/group/:chatId", protect, deleteGroupChat) 
export default router