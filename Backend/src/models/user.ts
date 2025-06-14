import mongoose, { Schema, Document } from 'mongoose';

// User interface defining the document structure
export interface IUser extends Document {
  name: string;
  email: string;
  username: string;
  password: string;
  islogged: boolean;
  latitude: number;
  longitude: number;
}

// User schema definition
const UserSchema = new Schema({
  name: String,
  email: String,
  username: String,
  password: String,
  islogged: Boolean,
  latitude: Number,
  longitude: Number
});

// Export the model
export default mongoose.model<IUser>('User', UserSchema);