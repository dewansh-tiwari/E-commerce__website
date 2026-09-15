import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryServer = null;

export const connectDB = async () => {
  try {
    let connUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/freshkart';
    
    // Try connecting to standard MongoDB
    try {
      await mongoose.connect(connUri, {
        serverSelectionTimeoutMS: 2000
      });
      console.log(`MongoDB Connected: ${mongoose.connection.host}`);
    } catch (err) {
      console.log('Local MongoDB not available. Starting MongoMemoryServer for zero-config running...');
      mongoMemoryServer = await MongoMemoryServer.create();
      connUri = mongoMemoryServer.getUri();
      await mongoose.connect(connUri);
      console.log(`In-Memory MongoDB Connected: ${connUri}`);
    }
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};
