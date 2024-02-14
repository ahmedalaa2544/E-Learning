import roomModel from "../../../DB/model/room.model.js";
import { asyncHandler } from "../../utils/asyncHandling.js";
import { WebhookReceiver } from "livekit-server-sdk";

export const room_started = asyncHandler(async (req, res, next) => {
  // create receiver
  const receiver = new WebhookReceiver(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_SECRET_KEY
  );

  // event is a WebhookEvent object
  const event = receiver.receive(req.body, req.get("Authorization"));

  // edit room status
  await roomModel.findOneAndUpdate(
    { sessionId: event?.room?.sid },
    {
      roomStatus: "Started",
    }
  );
});

export const room_finished = asyncHandler(async (req, res, next) => {
  // create receiver
  const receiver = new WebhookReceiver(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_SECRET_KEY
  );

  // event is a WebhookEvent object
  const event = receiver.receive(req.body, req.get("Authorization"));

  // edit room status
  await roomModel.findOneAndUpdate(
    { sessionId: event?.room?.sid },
    {
      roomStatus: "Finshed",
    }
  );
});
