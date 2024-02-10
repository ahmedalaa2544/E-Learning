import { Schema, Types, model } from "mongoose";

const roomSchema = new Schema(
  {
    title: { type: String, required: true },
    roomName: { type: String, required: true },
    sessionId: { type: String },
    duration: { type: Number, default: 600 }, // 10 * 60 = 10 minutes
    maxParticipants: { type: Number, default: 20 },
    activeRecording: { type: Boolean, default: false },
    metaData: { type: String },
    turnPassword: { type: String },
    // Private: not assigned to workshop
    roomType: { type: String, enum: ["Private", "Public"], default: "Private" }, // belong to workshop or not
    participants: [
      {
        identity: { type: String },
        userId: { type: Types.ObjectId, ref: "User" },
      },
    ],
    publishers: [{ type: Types.ObjectId, ref: "User" }],
    workshopId: { type: Types.ObjectId, ref: "Workshop" },
    roomStatus: { type: String },
  },
  { timestamps: true }
);

const roomModel = model("Room", roomSchema);

export default roomModel;
