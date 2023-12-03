import mongoose from "mongoose";

const connectDB = async () => {
  return await mongoose
    .connect(`${process.env.CONNECTION_URL}`)
    .then((result) => {
      console.log("connected to database....");
    })
    .catch((error) => {
      console.log("failed to connect to database", error);
    });
};

export default connectDB;
