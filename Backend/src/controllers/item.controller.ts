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
 * Deletes an item from the database if the requester is the owner
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
    
    // Authorization logic: Check if user is allowed to remove this item
    let isAuthorized = false;
    let authReason = '';
    
    // Debug log to help diagnose the issue
    console.log(`Removal request - Item: ${itemId}, User: ${username}, ItemOwner: ${item.owner}, WinningUser: "${item.wininguser}", Sold: ${item.sold}, RemainingTime: ${item.remainingtime}`);
    
    // Check if the item is sold and has a winning user
    const hasSoldWithWinner = item.sold && item.wininguser && item.wininguser.trim() !== '';
    // Check if item has expired with no winner
    const hasExpiredNoWinner = (item.remainingtime <= 0) && (!item.wininguser || item.wininguser.trim() === '');
    
    // Case 1: Owner permissions
    if (item.owner === username) {
      // Owner can delete their items ONLY IF:
      // - The item is not sold yet, OR
      // - The item is sold but has no winning user (expired with no bidder)
      if (!hasSoldWithWinner) {
        isAuthorized = true;
        authReason = 'owner';
      } else {
        // Owner cannot delete items sold to someone else
        authReason = 'not authorized - item sold to another user';
      }
    } 
    // Case 2: Winning bidder permissions - can delete items they won
    else if (hasSoldWithWinner && item.wininguser === username) {
      isAuthorized = true;
      authReason = 'winning bidder';
    }
    // Case 3: Any user can delete expired items with no bidder
    else if (hasExpiredNoWinner) {
      isAuthorized = true;
      authReason = 'expired with no bidder (any user can remove)';
    }
    
    if (!isAuthorized) {
      res.status(403).json({ 
        message: 'You are not authorized to remove this item. Items sold to a bidder can only be deleted by the winning bidder.'
      });
      return;
    }
    
    console.log(`User ${username} authorized to delete item ${itemId} as the ${authReason}`);
    
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