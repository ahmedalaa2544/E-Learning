import { Schema, Types, model } from "mongoose";

const roomSchema = new Schema(
  {
    roomName: { type: String, required: true },
    sessionId: { type: String },
    duration: { type: Number, default: 600 }, // 10 * 60 = 10 minutes
    maxParticipants: { type: Number, default: 20 },
    activeRecording: { type: Boolean, default: false },
    metaData: { type: String },
    turnPassword: { type: String },
    participants: [{ type: Types.ObjectId, ref: "User" }],
    publishers: [{ type: Types.ObjectId, ref: "User" }],
    workshopId: { type: Types.ObjectId, ref: "Workshop" },
  },
  { timestamps: true }
);

const roomModel = model("Room", roomSchema);

export default roomModel;
