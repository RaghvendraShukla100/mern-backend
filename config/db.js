import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected`);
  } catch (error) {
    console.log(`
        MongoDB Connection Failed.
        ERROR :  ${error.message}
        `);
    process.exit(1);
  }
};
