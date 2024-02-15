import { asyncHandler } from "../../utils/asyncHandling.js";
import { WebhookReceiver } from "livekit-server-sdk";
import participantModel from "../../../DB/model/participant.model.js";
import roomModel from "../../../DB/model/room.model.js";

export const room_started = asyncHandler(async (req, res, next) => {
  // create receiver
  const receiver = new WebhookReceiver(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_SECRET_KEY
  );

  // response is a WebhookEvent object
  const response = receiver.receive(req.body, req.get("Authorization"));

  // edit room status
  const room = await roomModel.findOneAndUpdate(
    { sessionId: response?.room?.sid },
    {
      roomStatus: "Started",
      turnPassword: response?.room?.turnPassword,
      createdAt: response?.createdAt,
    }
  );

  // send response
  return res.status(200).json({
    success: true,
    message: "Room Started Successfully!",
    results: room,
  });
});

export const room_finished = asyncHandler(async (req, res, next) => {
  // create receiver
  const receiver = new WebhookReceiver(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_SECRET_KEY
  );

  // response is a WebhookEvent object
  const response = receiver.receive(req.body, req.get("Authorization"));

  // edit room status
  const room = await roomModel.findOneAndUpdate(
    { sessionId: response?.room?.sid },
    {
      roomStatus: "Finshed",
    }
  );

  // send response
  return res.status(200).json({
    success: true,
    message: "Room Finshed Successfully!",
    results: room,
  });
});

export const participant_joined = asyncHandler(async (req, res, next) => {
  // create receiver
  const receiver = new WebhookReceiver(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_SECRET_KEY
  );

  // response is a WebhookEvent object
  const {
    participant: { sid, identity, joinedAt, version, permission, region },
    room,
  } = receiver.receive(req.body, req.get("Authorization"));

  // check participant existence
  const participantExists = await participantModel.find({ participantId: sid });
  if (participantExists) {
    participantExists.status.push("Joined");
    await participantExists.save();

    // send response
    return res.status(200).json({
      success: true,
      message: "Participant Joined Successfully!",
      results: participant,
    });
  }

  // create new participant
  const participant = await participantModel.create({
    participantId: sid,
    identity,
    status: ["Joined"],
    joinedAt,
    version,
    permission,
    region,
  });

  // add participant to room
  await roomModel.findOneAndUpdate(
    { sessionId: room.sid },
    {
      $push: { participants: participant },
    }
  );

  // send response
  return res.status(201).json({
    success: true,
    message: "Participant Joined Successfully!",
    results: participant,
  });
});

export const participant_left = asyncHandler(async (req, res, next) => {
  // create receiver
  const receiver = new WebhookReceiver(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_SECRET_KEY
  );

  // response is a WebhookEvent object
  const {
    participant: { sid },
  } = receiver.receive(req.body, req.get("Authorization"));

  // check participant existence
  const participantExists = await participantModel.find({ participantId: sid });
  if (!participantExists)
    return next(
      new Error("Participant hasn't joined the room", { cause: 400 })
    );

  // edit participant status
  participantExists.status.push("Left");
  await participantExists.save();

  // send response
  return res.status(200).json({
    success: true,
    message: "Participant Left Successfully!",
    results: participantExists,
  });
});
