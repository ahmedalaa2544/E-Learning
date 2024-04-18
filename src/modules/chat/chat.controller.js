import chatModel from "../../../DB/model/chat.model.js";
import { asyncHandler } from "../../utils/asyncHandling.js";
import upload from "../../utils/azureServices.js";
import { getIo } from "../../utils/server.js";

export const sendMsg = asyncHandler(async (req, res, next) => {
  const { message } = req.body;
  const { chatId } = req.params;

  // get the chat
  let chat = await chatModel
    .findById(chatId)
    .populate([
      { path: "participants", select: "userName profilePic socketId" },
    ]);

  // create chat if not found
  if (!chat) {
    return next(new Error("chat not found", { cause: 404 }));
  }
  const dateOfPublish = Date.now(); // to change the url from pic to another
  // sockets who sent to them
  let destIds = chat.participants.filter(
    (participant) => participant.id !== req.user.id
  );
  let socketIds = destIds.map((participant) => participant.socketId);

  // Send files
  if (req.file) {
    // Extract the extension for the promotion media.
    const blobMediaExtension = req.file.originalname.split(".").pop();
    // Define the path for the promotion media in the user's course directory.
    const blobMediaName = `Users\\${req.user.userName}\\ChatMedia\\${dateOfPublish}.${blobMediaExtension}`;
    // Upload media and obtain its URL.
    let typeOfMedia = req.file.mimetype.split("/")[0];
    const mediaUrl = await upload(
      req.file.path,
      blobMediaName,
      typeOfMedia,
      blobMediaExtension
    );

    // save changes in DB
    chat.messages.push({
      from: req.user.id,
      to: destIds,
      media: { url: mediaUrl, size: req.file.size, typeOfMedia },
      time: dateOfPublish,
    });
    getIo()
      .to(socketIds)
      .emit("recieveMsg", {
        from: req.user.id,
        to: destIds,
        media: { url: mediaUrl, size: req.file.size, typeOfMedia },
        time: dateOfPublish,
      });
    chat.messages.status = "delivered";
    await chat.save();
    return res.status(200).json({ message: "Done" });
  }

  // Send messages
  if (message) {
    chat.messages.push({
      from: req.user.id,
      to: destIds,
      text: message,
      time: dateOfPublish,
    });
    await chat.save();
    getIo().to(socketIds).emit("recieveMsg", {
      from: req.user.id,
      to: destIds,
      text: message,
      time: dateOfPublish,
    });
    chat.messages.status = "delivered";
    return res.status(200).json({ message: "Done" });
  }
  getIo().to(req.user.socketId).emit("emptyMsg", "Please, Enter Vaild Message");
  return next(
    new Error("emptyMsg", "Please, Enter Vaild Message", { cause: 400 })
  );
});

export const getChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { user } = req.query;
  if (user == "true") {
    let chat = await chatModel
      .findOne({
        participants: { $elemMatch: { $eq: chatId } },
        type: "private",
      })
      .populate([{ path: "participants", select: "userName profilePic" }])
      .slice("messages", -15);
    if (!chat) {
      let arr = [req.user.id, chatId];
      chat = await chatModel.create({
        participants: arr,
        messages: [],
        type: "private",
      });
    }
    return res.status(200).json({ message: "Done", chat });
  }
  const chat = await chatModel
    .findById(chatId)
    .populate([{ path: "participants", select: "userName profilePic" }])
    .slice("messages", -15);
  return res.status(200).json({ message: "Done", chat });
});

export const Chats = asyncHandler(async (req, res) => {
  const chat = await chatModel
    .find({ participants: { $elemMatch: { $eq: req.user.id } } })
    .populate([{ path: "participants", select: "userName profilePic" }])
    .sort({ updatedAt: -1 })
    .slice("messages", -1);

  return res.status(200).json({ message: "Done", chat });
});

export const allMessages = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 15;

  const startIndex = page * limit;
  const endIndex = (page + 1) * limit;
  const { chatId } = req.params;

  const chat = await chatModel
    .findById(chatId)
    .populate([{ path: "participants", select: "userName profilePic" }]);

  const messages = chat.messages.slice(startIndex, endIndex);
  return res.status(200).json({ message: "Done", messages });
});
