import chatModel from "../../../DB/model/chat.model.js";
import userModel from "../../../DB/model/user.model.js";
import { asyncHandler } from "../../utils/asyncHandling.js";
import upload from "../../utils/azureServices.js";
import { getIo } from "../../utils/server.js";

export const sendMsg = asyncHandler(async (req, res, next) => {
  const { message, destId } = req.body;
  // get destination user to get his socketId
  const destUser = await userModel.findById(destId);
  if (!destUser) return next(new Error("user not found", { cause: 404 }));

  // get the chat
  let chat = await chatModel
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

  // create chat if not found
  if (!chat) {
    chat = await chatModel.create({
      POne: req.user.id,
      PTwo: destId,
      messages: [],
    });
  }

  // Send files
  if (req.file) {
    // Extract the extension for the promotion media.
    const blobMediaExtension = req.file.originalname.split(".").pop();
    // Define the path for the promotion media in the user's course directory.
    const dateOfPublish = Date.now(); // to change the url from pic to another
    const blobMediaName = `Users\\${req.user.userName}\\ChatMedia\\${dateOfPublish}.${blobMediaExtension}`;
    // Upload media and obtain its URL.
    const mediaUrl = await upload(
      req.file.path,
      blobMediaName,
      "media",
      blobMediaExtension
    );

    // save changes in DB
    chat.messages.push({
      from: req.user.id,
      to: destId,
      media: mediaUrl,
    });
    getIo().to(destUser.socketId).emit("recieveMsg", mediaUrl);
    chat.messages.status = "delivered";
    await chat.save();
    return res.status(200).json({ message: "Done" });
  }

  // Send messages
  if (message) {
    chat.messages.push({
      from: req.user.id,
      to: destId,
      text: message,
    });
    await chat.save();
    getIo().to(destUser.socketId).emit("recieveMsg", message);
    chat.messages.status = "delivered";
    return res.status(200).json({ message: "Done" });
  }
  getIo().to(destUser.socketId).emit("emptyMsg", "Please, Enter Vaild Message");
  return next(
    new Error("emptyMsg", "Please, Enter Vaild Message", { cause: 400 })
  );
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
    .sort({ updatedAt: -1 })
    .slice("messages", -1);

  return res.status(200).json({ message: "Done", chat });
});
