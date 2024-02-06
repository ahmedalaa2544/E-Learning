import { asyncHandler } from "../../utils/asyncHandling.js";
import roomModel from "../../../DB/model/room.model.js";
import workshopModel from "../../../DB/model/workshop.model.js";
import { AccessToken, RoomServiceClient } from "livekit-server-sdk";
import randomstring from "randomstring";

export const createRoom = asyncHandler(async (req, res, next) => {
  // data
  const { duration, maximumParticipants, workshopId } = req.body;

  // check workshop existence
  if (workshopId) {
    const workshop = await workshopModel.findById(workshopId);
    if (!workshop)
      return next(new Error("Workshop Not found!", { cause: 404 }));
  }

  // generate room name
  const roomName = randomstring.generate({
    length: 10,
    charset: ["alphabetic", "numeric", "!"],
  });

  // initialize RoomServiceClient
  const roomService = new RoomServiceClient(
    process.env.LIVEKIT_WEBSOCKET_URL,
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_SECRET_KEY
  );

  // session options
  const opts = {
    name: roomName,
    emptyTimeout: duration ? duration : 600,
    maxParticipants: maximumParticipants ? maximumParticipants : 20,
  };

  // create session on cloud
  const {
    sid,
    name,
    emptyTimeout,
    maxParticipants,
    turnPassword,
    metadata,
    activeRecording,
  } = await roomService.createRoom(opts);

  // create room
  const room = await roomModel.create({
    roomName: name,
    sessionId: sid,
    duration: emptyTimeout,
    metaData: metadata,
    maxParticipants,
    activeRecording,
    turnPassword,
    ...(workshopId && { workshopId }),
    ...(workshopId && { roomType: "Public" }),
  });

  // add room to workshop if public
  if (workshopId) {
    await workshopModel.findByIdAndUpdate(workshopId, {
      $push: { rooms: room._id },
    });
  }

  // send response
  return res.status(201).json({
    success: true,
    message: "Room Created Successfully!",
    results: room,
  });
});

export const joinRoom = asyncHandler(async (req, res, next) => {
  // receive data
  const { roomId } = req.body;

  // check room existence
  const room = await roomModel.findById(roomId);
  if (!room) return next(new Error("Room not found!", { cause: 404 }));

  // generate token for logged User
  const accessToken = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_SECRET_KEY,
    { identity: req.user.userName }
  );
  accessToken.addGrant({ roomJoin: true, room: room.roomName });

  // add logged user to participants of room
  await roomModel.findByIdAndUpdate(roomId, {
    $push: { participants: req.user._id },
  });

  // send response
  return res.status(201).json({
    success: true,
    message: "Access Token Generated Successfully!",
    token: accessToken.toJwt(),
  });
});

export const getSpecificRoom = asyncHandler(async (req, res, next) => {
  // data
  const { roomId } = req.params;

  // check room existence
  const room = await roomModel.findById(roomId);
  if (!room) return next(new Error("Room not found!", { cause: 404 }));

  return res.status(200).json({
    success: true,
    message: "Room Found Successfully!",
    results: room,
  });
});

export const deleteRoom = asyncHandler(async (req, res, next) => {
  // recieve data
  const { roomId } = req.params;

  // check room existence
  const room = await roomModel.findById(roomId);
  if (!room) return next(new Error("Room not found!", { cause: 404 }));

  // only workshop instructor can delete room
  const workshop = await workshopModel.findById(room.workshopId);
  if (workshop && !workshop.instructor.equals(req.user._id))
    return next(
      new Error("Only workshop instructor can delete room", { cause: 405 })
    );

  // initialize RoomServiceClient
  const roomService = new RoomServiceClient(
    process.env.LIVEKIT_WEBSOCKET_URL,
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_SECRET_KEY
  );

  // delete room from cloud
  await roomService.deleteRoom(room.roomName);

  // delelte room from workshop
  if (workshop) {
    await workshopModel.findByIdAndUpdate(workshop._id, {
      $pull: { rooms: roomId },
    });
  }

  // delete room from DB
  await roomModel.findByIdAndDelete(roomId);

  return res.status(200).json({
    success: true,
    message: `Room ${room.roomName} Deleted Successfully!`,
  });
});

export const getOnlineRooms = asyncHandler(async (req, res, next) => {
  // initialize RoomServiceClient
  const roomService = new RoomServiceClient(
    process.env.LIVEKIT_WEBSOCKET_URL,
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_SECRET_KEY
  );

  // online rooms on cloud
  const cloudOnlineRooms = await roomService.listRooms();

  // extract sessionIds
  let sessionIds = cloudOnlineRooms?.map((session) => session.sid);

  // online rooms documents
  const rooms = await roomModel.find({ sessionId: { $in: sessionIds } });

  // send response
  return res
    .status(200)
    .json({ success: true, message: "All Online Rooms", results: rooms });
});
