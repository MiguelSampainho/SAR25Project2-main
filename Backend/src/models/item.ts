import mongoose, { Schema, Document } from 'mongoose';

// Item interface defining the document structure
export interface IItem extends Document {
  description: string;
  currentbid: number;
  remainingtime: number;
  buynow: number;
  wininguser: string;
  sold: boolean;
  owner: string;
  id: number;
}

// Item schema definition
const ItemSchema = new Schema({
  description: String,
  currentbid: Number,
  remainingtime: Number,
  buynow: Number,
  wininguser: String,
  sold: Boolean,
  owner: String,
  id: Number
});

// Add index for better query performance
ItemSchema.index({ sold: 1, remainingtime: 1 });

// Export the model
export default mongoose.model<IItem>('Item', ItemSchema);