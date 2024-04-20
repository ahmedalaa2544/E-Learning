import chatModel from "../../../DB/model/chat.model.js";
import userModel from "../../../DB/model/user.model.js";
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
      to: chatId,
      media: {
        url: mediaUrl,
        size: req.file.size,
        name: req.file.originalname,
        typeOfMedia,
      },
      time: dateOfPublish,
    });
    getIo()
      .to(socketIds)
      .emit("recieveMsg", {
        from: req.user.id,
        to: chatId,
        media: {
          url: mediaUrl,
          size: req.file.size,
          name: req.file.originalname,
          typeOfMedia,
        },
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
      to: chatId,
      text: message,
      time: dateOfPublish,
    });
    await chat.save();
    getIo().to(socketIds).emit("recieveMsg", {
      from: req.user.id,
      to: chatId,
      text: message,
      time: dateOfPublish,
    });
    chat.messages.status = "delivered";
    return res.status(200).json({ message: "Done" });
  }
  getIo().to(req.user.socketId).emit("emptyMsg", "Please, Enter Vaild Message");
  return next(new Error("Please, Enter Vaild Message", { cause: 400 }));
});

export const getChat = asyncHandler(async (req, res, next) => {
  const { chatId } = req.params;
  const { user } = req.query;
  if (user == "true") {
    if (chatId == req.user.id) {
      return next(
        new Error("Enter Vaild User (Not Yourself Psycho!)", { cause: 400 })
      );
    }
    let Chat = await chatModel
      .findOne({
        participants: { $all: [chatId, req.user.id] },
        type: "private",
      })
      .populate([{ path: "participants", select: "userName profilePic" }]);
    if (!Chat) {
      const checkUser = await userModel.findById(chatId);
      if (!checkUser) return next(new Error("user not found", { cause: 404 }));
      let arr = [req.user.id, chatId];
      Chat = await chatModel.create({
        participants: arr,
        messages: [],
        type: "private",
      });
      const newChat = await chatModel
        .findById(Chat.id)
        .populate([{ path: "participants", select: "userName profilePic" }]);
      const { messages, ...chat } = newChat.toObject();
      return res.status(201).json({ message: "Done", chat });
    }
    const { messages, ...chat } = Chat.toObject();
    return res.status(200).json({ message: "Done", chat });
  }
  const Chat = await chatModel
    .findById(chatId)
    .populate([{ path: "participants", select: "userName profilePic" }]);
  if (!Chat) return next(new Error("chat not found", { cause: 404 }));
  const { messages, ...chat } = Chat.toObject();
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
  const page = req.query.page || 0;
  const limit = 15;

  const startIndex = +page * limit;
  const endIndex = (+page + 1) * limit;
  const { chatId } = req.params;

  const chat = await chatModel
    .findById(chatId)
    .populate([{ path: "participants", select: "userName profilePic" }]);

  const messages = chat.messages.reverse().slice(startIndex, endIndex);
  return res.status(200).json({ message: "Done", messages });
});

export const createGroup = asyncHandler(async (req, res, next) => {
  const { name, participants } = req.body;
  console.log(req.body.name);
  console.log(participants);

  let imageUrl;
  // Send files
  if (req.file) {
    // Extract the extension for the promotion media.
    const blobMediaExtension = req.file.originalname.split(".").pop();
    // Define the path for the promotion media in the user's course directory.
    const dateOfPublish = Date.now();
    const blobMediaName = `Users\\${req.user.userName}\\ChatMedia\\${dateOfPublish}.${blobMediaExtension}`;
    // Upload media and obtain its URL.
    let typeOfMedia = req.file.mimetype.split("/")[0];
    imageUrl = await upload(
      req.file.path,
      blobMediaName,
      typeOfMedia,
      blobMediaExtension
    );
  }
  const chat = await chatModel.create({
    name,
    participants,
    type: "group",
    messages: [],
    pic: imageUrl ? imageUrl : "",
  });
  return res.status(200).json({ message: "Done", chat });
});
