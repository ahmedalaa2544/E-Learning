import { Schema, model ,Types} from "mongoose";

const lectureSchema = new Schema(
  {
    course:{
        type: Types.ObjectId,
        ref: "Course",
        reuired:true
    },
    courseChapter:{
        type: Types.ObjectId,
        ref: "CourseChapter",
        reuired:true
    },
    number:{
        type:Number,
        required:true
      },
    order:{
    type:Number,
    required:true
    },
    
    lectureType: {
        type: String,
        num: ["video", "article"],
        required:true
      },
    title:{
        type:String,
        required:true
    },
    describtion:{
        type:String
    },
    videoUrl:{
        type:String,
        required: function () {
            return this.type==="video";
        }
    },
    resources:[
        {
            name:{
                type:String,
                max:60
            },
            url:{
                type:String
            }
        }
    ]
        ,
    article:{
        type:String,
        required: function () {
            return this.type==="article";
        }
    }
    

  },

    { timestamps: true }

)




const lectureModel = model("Lecture", lectureSchema);
export default lectureModel;
