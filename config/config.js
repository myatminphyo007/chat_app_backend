import mongoose from "mongoose";



const mongoDB = async () => {
  const mongoURL = process.env.MONGO_URL;
  try {
    await mongoose.connect(mongoURL);

    console.log("MongoDB connected");
  } catch (error) {
    console.log("MongoDB connection error:", error.message);
  }
};

export default mongoDB;