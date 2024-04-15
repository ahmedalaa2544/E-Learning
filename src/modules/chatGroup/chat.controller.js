import chatGroupModel from "../../../DB/model/chatGroup.model.js";
import userModel from "../../../DB/model/user.model.js";
import { asyncHandler } from "../../utils/asyncHandling.js";
import { getIo } from "../../utils/server.js";

export const sendMsg = asyncHandler(async (req, res, next) => {
  const { message, chatId } = req.body;
  const chat = await chatGroupModel
    .findById(chatId)
    .populate([
      { path: "participants", select: "userName profilePic socketId" },
    ]);

  if (!chat) {
    return next(new Error("chat not found", { cause: 404 }));
  }

  chat.messages.push({
    from: req.user.id,
    message,
  });
  await chat.save();

  let socketIds = chat.participants
    .filter((participant) => participant.id !== req.user.id)
    .map((participant) => participant.socketId);

  getIo().to(socketIds).emit("recieveMsg", message);
  return res.status(200).json({ message: "Done", chat });
});

export const getChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const chat = await chatGroupModel
    .findById(chatId)
    .populate([{ path: participants, select: "userName profilePic" }]);

  return res.status(200).json({ message: "Done", chat });
});

export const Chats = asyncHandler(async (req, res) => {
  const chat = await chatGroupModel
    .find({
      participants: { $elemMatch: { $eq: req.user.id } },
    })
    .select("name")
    .sort({ updatedAt: -1 });

  return res.status(200).json({ message: "Done", chat });
});

export const createChat = asyncHandler(async (req, res, next) => {
  const chat = await chatGroupModel.create({
    participants: req.body.participants,
    name: req.body.name,
    messages: [
      {
        from: req.user.id,
        message: `Welcome to ${req.body.name} Group`,
      },
    ],
  });
  return res.status(201).json({ message: "Done", chat });
});
