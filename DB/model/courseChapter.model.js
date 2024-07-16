import { Schema, model ,Types} from "mongoose";

const couresChapterSchema = new Schema(
  {
    coures:{
      type: Types.ObjectId,
      ref: "Course",
      reuired:true
    },
    number:{
      type:Number,
      required:true
    },
    title:{
      type:String,
      required:true,
      max:80
    },
    learningObjective:{
      type:String,
      required:true,
      max:200
    },
    lectures:[
      {
        type: Types.ObjectId,
        ref: "Lecture",
           
    }]
  },

    { timestamps: true }

)




const courseChapterModel = model("CourseChapter", couresChapterSchema);
export default courseChapterModel;
