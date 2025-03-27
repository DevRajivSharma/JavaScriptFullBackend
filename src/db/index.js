import mongoose from 'mongoose'
import { DB_NAME } from "../constant.js";

const connectDB = async () => {
  try{
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
    console.log(`\n Connected to MongoDB connection \n DB HOST: 
    ${connectionInstance.connection.host}`);
  }
  catch(err){
    console.log("DB connection error:", err);
    process.exit(1);
  }
}

export default connectDB;