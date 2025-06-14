import mongoose from 'mongoose';
import config from './config';

/**
 * Database connection helper
 */
export const connectDatabase = async (): Promise<void> => {
  try {
    mongoose.set('strictQuery', false);
    
    await mongoose.connect(config.mongoUri);
    
    console.log(`MongoDB connected: ${config.mongoUri}`);
    
    mongoose.connection.on('error', err => {
      console.error(`MongoDB connection error: ${err}`);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
    
    // Clean up connection on app termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to app termination');
      process.exit(0);
    });
    
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};