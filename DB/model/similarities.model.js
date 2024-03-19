import { Schema, model, Types } from "mongoose";

const similaritiesSchema = new Schema(
  {
    course: {
      type: Types.ObjectId,
      ref: "Course",
      reuired: true,
    },
    similarities: [
      {
        course: {
          type: Types.ObjectId,
          ref: "Course",
          reuired: true,
        },
        similarity: Number,
      },
    ],
  },

  { timestamps: true }
);

const similaritiesModel = model("Similarities", similaritiesSchema);
export default similaritiesModel;
