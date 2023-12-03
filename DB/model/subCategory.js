import { Schema, Types, model } from "mongoose";

const subCategorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    categoryId: { type: Types.ObjectId, ref: "Category", required: true },
  },
  { timestamps: true }
);

const subCategoryModel = model("SubCategory", subCategorySchema);
export default subCategoryModel;
