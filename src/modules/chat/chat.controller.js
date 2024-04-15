import chatModel from "../../../DB/model/chat.model.js";
import userModel from "../../../DB/model/user.model.js";
import { asyncHandler } from "../../utils/asyncHandling.js";
import { getIo } from "../../utils/server.js";

export const search = asyncHandler(async (req, res, next) => {
  const query = req.query.q.toLowerCase();

  let matchedData;

  if (query == "" || query == " ") {
    matchedData = "";
    return res.status(200).json({ message: "Done", matchedData });
  }

  const users = await userModel.find().select("userName profilePic");

  if (!req.query.next) {
    matchedData = users
      .filter((item) => item.userName.toLowerCase().includes(query))
      .slice(0, 5);
    return res.status(200).json({ message: "Done", matchedData });
  }
  if (req.query.next) {
    const limit = (+req.query.next + 1) * 5;
    const start = +req.query.next * 5;
    matchedData = users
      .filter((item) => item.userName.toLowerCase().includes(query))
      .slice(start, limit);
  }

  // respone
  return res.status(200).json({ message: "Done", matchedData });
});

export const sendMsg = asyncHandler(async (req, res, next) => {
  const { message, destId } = req.body;
  const destUser = await userModel.findById(destId);
  if (!destUser) return next(new Error("user not found", { cause: 404 }));

  const chat = await chatModel
    .findOne({
      $or: [
        { POne: req.user.id, PTwo: destId },
        { POne: destId, PTwo: req.user.id },
      ],
    })
    .populate([
      { path: "POne", select: "userName profilePic" },
      { path: "PTwo", select: "userName profilePic" },
    ]);

  if (!chat) {
    const chat = await chatModel.create({
      POne: req.user.id,
      PTwo: destId,
      messages: [
        {
          from: req.user.id,
          to: destId,
          message,
        },
      ],
    });
    getIo().to(destUser.socketId).emit("recieveMsg", message);
    return res.status(201).json({ message: "Done", chat });
  }
  chat.messages.push({
    from: req.user.id,
    to: destId,
    message,
  });
  await chat.save();
  getIo().to(destUser.socketId).emit("recieveMsg", message);
  return res.status(200).json({ message: "Done", chat });
});

export const getChat = asyncHandler(async (req, res) => {
  const { destId } = req.params;
  const chat = await chatModel
    .findOne({
      $or: [
        { POne: req.user.id, PTwo: destId },
        { POne: destId, PTwo: req.user.id },
      ],
    })
    .populate([
      { path: "POne", select: "userName profilePic" },
      { path: "PTwo", select: "userName profilePic" },
    ]);

  return res.status(200).json({ message: "Done", chat });
});

export const Chats = asyncHandler(async (req, res) => {
  const chat = await chatModel
    .find({
      $or: [{ POne: req.user.id }, { PTwo: req.user.id }],
    })
    .populate([
      { path: "POne", select: "userName profilePic" },
      { path: "PTwo", select: "userName profilePic" },
    ])
    .sort({ updatedAt: -1 });

  return res.status(200).json({ message: "Done", chat });
});
