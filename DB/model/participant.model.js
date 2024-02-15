import { Schema, Types, model } from "mongoose";

const participantSchema = new Schema(
  {
    participantId: { type: String },
    identity: { type: String },
    status: [{ type: String }],
    joinedAt: { type: String },
    version: { type: Number },
    permission: {
      canSubscribe: { type: Boolean },
      canPublish: { type: Boolean },
    },
    region: { type: String },
  },
  { timestamps: true }
);

const participantModel = model("Participant", participantSchema);

export default participantModel;
