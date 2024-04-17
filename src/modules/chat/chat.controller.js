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
  if (req.files) {
    // send image
    if (req.files.image) {
      // Extract the extension for the promotion image.
      const blobImageExtension = req.files.image[0].originalname
        .split(".")
        .pop();

      const time = new Date();
      // Define the path for the promotion image in the user's course directory.
      const blobImageName = `Users\\${req.user.userName}_${
        req.user._id
      }\\Chats\\${chat.POne}_${chat.PTwo}\\${new Date()}.${blobImageExtension}`;

      // Upload the promotion image and obtain its URL.
      const imageUrl = await upload(
        req.files.image[0].path,
        blobImageName,
        "image",
        blobImageExtension
      );

      // save changes in DB
      chat.messages.push({
        from: req.user.id,
        to: destId,
        image: imageUrl,
      });
      getIo().to(destUser.socketId).emit("recieveMsg", imageUrl);
      chat.messages.status = "delivered";
      await chat.save();
      return res.status(200).json({ message: "Done", chat });
    }

    // send video
    if (req.files.video) {
      // Extract the extension for the promotion video.
      const blobVideoExtension = req.files.video[0].originalname
        .split(".")
        .pop();

      // Define the path for the promotion video in the user's course directory.
      const blobVideoName = `Users\\${req.user.userName}_${
        req.user._id
      }\\Chats\\${chat.POne}_${chat.PTwo}\\${new Date()}.${blobVideoExtension}`;

      // Upload the promotion video and obtain its URL.
      const videoUrl = await upload(
        req.files.video[0].path,
        blobVideoName,
        "video",
        blobVideoExtension
      );

      // save changes in DB
      chat.messages.push({
        from: req.user.id,
        to: destId,
        video: videoUrl,
      });
      getIo().to(destUser.socketId).emit("recieveMsg", videoUrl);
      chat.messages.status = "delivered";
      await chat.save();
      return res.status(200).json({ message: "Done", chat });
    }

    // send voice
    if (req.files.voice) {
      // Extract the extension for the promotion voice.
      const blobvoiceExtension = req.files.voice[0].originalname
        .split(".")
        .pop();

      // Define the path for the promotion voice in the user's course directory.
      const blobvoiceName = `Users\\${req.user.userName}_${
        req.user._id
      }\\Chats\\${chat.POne}_${chat.PTwo}\\${new Date()}.${blobvoiceExtension}`;

      // Upload the promotion voice and obtain its URL.
      const voiceUrl = await upload(
        req.files.voice[0].path,
        blobvoiceName,
        "voice",
        blobvoiceExtension
      );

      // save changes in DB
      chat.messages.push({
        from: req.user.id,
        to: destId,
        voice: voiceUrl,
      });
      getIo().to(destUser.socketId).emit("recieveMsg", voiceUrl);
      chat.messages.status = "delivered";
      await chat.save();
      return res.status(200).json({ message: "Done", chat });
    }

    // send file
    if (req.files.file) {
      // Extract the extension for the promotion file.
      const blobfileExtension = req.files.file[0].originalname.split(".").pop();

      // Define the path for the promotion file in the user's course directory.
      const blobfileName = `Users\\${req.user.userName}_${
        req.user._id
      }\\Chats\\${chat.POne}_${chat.PTwo}\\${new Date()}.${blobfileExtension}`;

      // Upload the promotion file and obtain its URL.
      const fileUrl = await upload(
        req.files.file[0].path,
        blobfileName,
        "file",
        blobfileExtension
      );

      // save changes in DB
      chat.messages.push({
        from: req.user.id,
        to: destId,
        file: fileUrl,
      });
      getIo().to(destUser.socketId).emit("recieveMsg", fileUrl);
      chat.messages.status = "delivered";
      await chat.save();
      return res.status(200).json({ message: "Done", chat });
    }
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
