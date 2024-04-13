import { asyncHandler } from "../../utils/asyncHandling.js";
import { WebhookReceiver } from "livekit-server-sdk";
import participantModel from "../../../DB/model/participant.model.js";
import roomModel from "../../../DB/model/room.model.js";
import trackModel from "../../../DB/model/track.model.js";

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

  console.log("identity", identity);

  // parsing identity info from string to object {userId, identity}
  // const identityInfo = JSON.parse(identity);

  // check participant existence
  const participantExists = await participantModel.find({
    // "identity.userId": identityInfo.userId,
    identity,
  });

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
    // identity: identityInfo,
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
      $push: { participants: participant._id },
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

export const track_published = asyncHandler(async (req, res, next) => {
  // create receiver
  const receiver = new WebhookReceiver(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_SECRET_KEY
  );

  // response is a WebhookEvent object
  const {
    participant,
    track: { sid, type, name, source, mimeType, mid, stream },
  } = receiver.receive(req.body, req.get("Authorization"));

  // check participant existence
  const trackExists = await trackModel.find({ trackId: sid });
  if (trackExists)
    return next(new Error("Track already exists!", { cause: 409 }));

  // create new track
  const track = await trackModel.create({
    trackId: sid,
    type,
    name,
    source,
    mimeType,
    mid,
    stream,
    publishStatus: "Published",
  });

  // add the track to its participant
  await participantModel.findOneAndUpdate(
    { identity: participant.identity },
    {
      $push: { tracks: track._id },
    }
  );

  // send response
  return res.status(200).json({
    success: true,
    message: "Track Published Successfully!",
    results: track,
  });
});

export const track_unpublished = asyncHandler(async (req, res, next) => {
  // create receiver
  const receiver = new WebhookReceiver(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_SECRET_KEY
  );

  // response is a WebhookEvent object
  const {
    track: {
      sid,
      type,
      source,
      mimeType,
      mid,
      stream,
      width,
      height,
      simulcast,
    },
  } = receiver.receive(req.body, req.get("Authorization"));

  // check track existence
  const trackExists = await trackModel.find({ trackId: sid });
  if (!trackExists) return next(new Error("Track not found!", { cause: 404 }));

  // update track data
  const track = await trackModel.findByIdAndUpdate(trackExists._id, {
    type,
    source,
    mimeType,
    mid,
    stream,
    width,
    height,
    simulcast,
    publishStatus: "UnPublished",
  });

  // send response
  return res.status(200).json({
    success: true,
    message: "Track UnPublished Successfully!",
    results: track,
  });
});
