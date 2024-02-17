import { Schema, model } from "mongoose";

const trackSchema = new Schema(
  {
    trackId: { type: String },
    type: { type: String },
    name: { type: String },
    sourse: { type: String },
    mimeType: { type: String },
    mid: { type: String },
    stream: { type: String },
    publishStatus: { type: String, enum: ["Published", "UnPublished"] },
  },
  { timestamps: true }
);

const trackModel = model("Track", trackSchema);

export default trackModel;
