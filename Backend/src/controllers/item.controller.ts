import { Request, Response } from 'express';
import Item from '../models/item';
import socketService from '../services/socket.service';

/**
 * Create a new item
 * Creates a new auction item with an auto-incremented ID
 */
export const createItem = async (req: Request, res: Response): Promise<void> => {
  console.log("NewItem -> received form submission new item");
  
  try {
    // Extract data from request body
    const { description, currentbid, remainingtime, buynow, owner } = req.body;
    
    // Find the highest ID in the database
    const highestIdItem = await Item.findOne().sort({ id: -1 }).limit(1);
    
    // Generate new ID (highest + 1 or 1 if no items exist)
    const newId = highestIdItem ? highestIdItem.id + 1 : 1;
    
    // Create new item
    const newItem = new Item({
      description,
      currentbid,
      remainingtime,
      buynow,
      owner,
      wininguser: '', // Empty string for winning user
      sold: false,    // Not sold initially
      id: newId       // Auto-generated ID
    });
    
    // Save item to database
    const savedItem = await newItem.save();
    
    // Broadcast the new item to all connected clients
    socketService.broadcastNewItem(savedItem);
    
    // Return success response with created item
    res.status(201).json(savedItem);
    
    console.log(`Item with ID ${newId} successfully created`);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ message: 'Server error during item creation' });
  }
};

/**
 * Remove an existing item
 * Deletes an item from the database if the requester is the original owner
 * Only the original owner can remove an item, regardless of its sold status
 */
export const removeItem = async (req: Request, res: Response): Promise<void> => {
  console.log("RemoveItem -> received form submission remove item");
  
  try {
    const { itemId } = req.body;
    const username = req.user?.username;
    
    if (!itemId) {
      res.status(400).json({ message: 'Item ID is required' });
      return;
    }
    
    // Find the item
    const item = await Item.findOne({ id: itemId });
    
    if (!item) {
      res.status(404).json({ message: 'Item not found' });
      return;
    }
    
    // Simplified authorization logic: Only the original owner can remove an item
    if (item.owner !== username) {
      res.status(403).json({ 
        message: 'You are not authorized to remove this item. Only the original owner can remove items.'
      });
      return;
    }
    
    console.log(`User ${username} authorized to delete item ${itemId} as the owner`);
    
    // Remove the item
    await Item.deleteOne({ id: itemId });
    
    // Broadcast the removed item to all connected clients
    socketService.broadcastItemRemoved(itemId, item.description);
    
    res.status(200).json({ message: 'Item successfully removed' });
    console.log(`Item with ID ${itemId} successfully removed`);
  } catch (error) {
    console.error('Error removing item:', error);
    res.status(500).json({ message: 'Server error during item removal' });
  }
};

/**
 * Get all items
 * Retrieves all items from the database
 */
export const getItems = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get all items from the database
    const items = await Item.find({});
    
    // Send response
    res.json(items);
    console.log("received get Items call responded with items from database");
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ message: 'Server error while fetching items' });
  }
};