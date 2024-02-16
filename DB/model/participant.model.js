import { Schema, Types, model } from "mongoose";

const participantSchema = new Schema(
  {
    participantId: { type: String },
    identity: {
      userId: { type: Types.ObjectId, ref: "User" },
      userName: { type: String },
    },
    status: [{ type: String }],
    joinedAt: { type: String },
    version: { type: Number },
    permission: {
      canSubscribe: { type: Boolean },
      canPublish: { type: Boolean },
    },
    region: { type: String },
    tracks: [{ type: Types.ObjectId, ref: "Track" }],
  },
  { timestamps: true }
);

const participantModel = model("Participant", participantSchema);

export default participantModel;
