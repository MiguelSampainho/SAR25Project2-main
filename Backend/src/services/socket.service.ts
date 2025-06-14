import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import config from '../config/config';
import User from '../models/user';
import Item, { IItem } from '../models/item';

class SocketService {
  private io: Server | null = null;
  private socketIDbyUsername: Map<string, string> = new Map();
  private usernamebySocketID: Map<string, string> = new Map();
  private intervalId: NodeJS.Timeout | null = null;

  /**
   * Initialize Socket.IO server
   */
  public init(io: Server): void {
    this.io = io;
    
    // JWT authentication for socket.io
    io.use((socket: Socket, next) => {
      // Check for token in query or auth object (supporting both methods)
      const token = 
        socket.handshake.query?.token as string || 
        (socket.handshake.auth as any)?.token;
        
      if (token) {
        jwt.verify(token, config.jwtSecret, (err: jwt.VerifyErrors | null, decoded: any) => {
          if (err) {
            console.error('Socket auth error:', err.message);
            return next(new Error('Authentication error'));
          }
          socket.data.decoded_token = decoded;
          next();
        });
      } else {
        console.error('Socket auth error: No token provided');
        next(new Error('Authentication error: No token provided'));
      }
    });

    console.log('Socket service initialized');
    this.setupSocketEvents();
    this.startAuctionTimer();
  }

  /**
   * Set up socket event handlers
   */
  private setupSocketEvents(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: Socket) => {
      const username = socket.data.decoded_token.username;
      console.log(`${username} user connected`);
      
      // Store client in the maps
      this.socketIDbyUsername.set(username, socket.id);
      this.usernamebySocketID.set(socket.id, username);

      // Handle new user event
      socket.on('newUser:username', (data) => {
        console.log("newUser:username -> New user event received: ", data);
      });

      // Handle bid event
      socket.on('send:bid', async (data) => {
        console.log("send:bid -> Received event send:bid with data = ", data);
        
        try {
          const username = socket.data.decoded_token.username;
          const { item_id, bid } = data;
          
          // Find the item in the database
          const item = await Item.findOne({ id: item_id });
          
          if (!item) {
            throw new Error(`Item with ID ${item_id} not found`);
          }
          
          // Check if item is sold
          if (item.sold) {
            throw new Error('This item has already been sold');
          }
          
          // Check if the bidder is the owner
          if (item.owner === username) {
            throw new Error('You cannot bid on your own item');
          }
          
          // Check if bid amount is greater than current bid
          if (bid <= item.currentbid) {
            throw new Error(`Bid amount must be greater than the current bid of ${item.currentbid}`);
          }
          
          // Update the item with the new bid
          item.currentbid = bid;
          item.wininguser = username;
          
          // Save the updated item
          await item.save();
          
          console.log(`Bid accepted: ${username} bid ${bid} on item ${item_id}`);
          
          // Broadcast the updated item to all clients
          this.broadcastItemUpdate(item);
          
          // If the bid matches the buy now price, mark item as sold
          if (item.currentbid >= item.buynow) {
            await this.markItemAsSold(item);
          }
        } catch (error) {
          console.error("Error processing bid:", error);
          // Send error notification back to the client who made the bid
          socket.emit('bid:error', { 
            message: error instanceof Error ? error.message : 'Unknown error processing bid'
          });
        }
      });

      // Handle message event
      socket.on('send:message', (chat) => {
        console.log("send:message received with -> ", chat);
      });

      // Handle disconnection
      socket.on('disconnect', async () => {
        const username = this.usernamebySocketID.get(socket.id);
        console.log(`User disconnected: ${username}`);
        
        if (username) {
          // Update user's logged in status in the database
          try {
            const user = await User.findOne({ username });
            if (user) {
              user.islogged = false;
              await user.save();
              console.log(`User ${username} marked as logged out in database`);
              
              // Broadcast user logout to all clients
              this.userLoggedOutBroadcast(username);
            }
          } catch (error) {
            console.error(`Error updating logged out status for user ${username}:`, error);
          }
          
          // Clean up socket mappings
          this.socketIDbyUsername.delete(username);
        }
        this.usernamebySocketID.delete(socket.id);
      });
    });
  }

  /**
   * Start auction timer for item remaining time updates
   */
  private startAuctionTimer(): void {
    // Timer function to decrement remaining time and update clients
    this.intervalId = setInterval(async () => {
      try {
        // Find all unsold items
        const unsoldItems = await Item.find({ sold: false });
        
        // Track if any items need to be marked as sold
        let itemsSoldInThisUpdate = false;
        
        // Process each unsold item
        for (const item of unsoldItems) {
          // Decrement remaining time by 1 second
          item.remainingtime = Math.max(0, item.remainingtime - 1);
          
          // Check if the item should be marked as sold
          if (item.remainingtime === 0 && !item.sold) {
            item.sold = true;
            itemsSoldInThisUpdate = true;
            
            // Emit item:sold event with item data
            if (this.io) {
              this.io.emit('item:sold', {
                itemId: item.id,
                description: item.description,
                finalPrice: item.currentbid,
                winner: item.wininguser
              });
              
              console.log(`Auction ended: Item ${item.id} sold to ${item.wininguser} for ${item.currentbid}`);
            }
          }
        }
        
        // Save all changes to the database in a bulk operation if there are items to update
        if (unsoldItems.length > 0) {
          // Use Promise.all to save all items concurrently
          await Promise.all(unsoldItems.map(item => item.save()));
          
          // Query the database again for the complete list of all items
          const allItems = await Item.find({});
          
          // Broadcast the updated items list to all clients
          if (this.io) {
            this.io.emit('items:update', allItems);
          }
          
          // Log status update
          console.log(`Updated ${unsoldItems.length} items, ${itemsSoldInThisUpdate ? 'some items were sold' : 'no items sold'}`);
        }
      } catch (error) {
        console.error('Error in auction timer:', error);
      }
    }, 1000);
  }

  /**
   * Broadcast new logged-in user to all clients
   * @param user The user object containing username, latitude and longitude
   */
  public newLoggedUserBroadcast(user: any): void {
    if (this.io) {
      // Create a simplified user object with only required fields
      const userInfo = {
        username: user.username,
        latitude: user.latitude,
        longitude: user.longitude
      };
      
      // Broadcast to all connected clients
      this.io.emit('new:user', userInfo);
      console.log(`Broadcasting new logged-in user: ${user.username}`);
    }
  }

  /**
   * Broadcast user logged-out event to all clients
   * @param username The username of the logged out user
   */
  public userLoggedOutBroadcast(username: string): void {
    console.log(`Broadcasting user logout: ${username}`);
    if (this.io) {
      // Broadcast to all connected clients
      this.io.emit('user:left', { username: username });
    }
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  /**
   * Process a bid on an item
   * @param itemId The ID of the item being bid on
   * @param username The username of the bidder
   * @param bidAmount The bid amount
   * @returns The updated item document or null if the bid was invalid
   */
  private async processBid(itemId: number, username: string, bidAmount: number): Promise<IItem | null> {
    // Find the item by ID
    const item = await Item.findOne({ id: itemId });
    
    if (!item) {
      throw new Error(`Item with ID ${itemId} not found`);
    }

    // Check if item is sold
    if (item.sold) {
      throw new Error('This item has already been sold');
    }

    // Check if the bidder is the owner
    if (item.owner === username) {
      throw new Error('You cannot bid on your own item');
    }

    // Check if bid amount is greater than current bid
    if (bidAmount <= item.currentbid) {
      throw new Error(`Bid amount must be greater than the current bid of ${item.currentbid}`);
    }

    // Update the item with the new bid
    item.currentbid = bidAmount;
    item.wininguser = username;
    
    // Save the updated item
    await item.save();
    
    console.log(`Bid accepted: ${username} bid ${bidAmount} on item ${itemId}`);
    
    return item;
  }

  /**
   * Broadcast an item update to all connected clients
   * @param item The updated item to broadcast
   */
  private broadcastItemUpdate(item: IItem): void {
    if (this.io) {
      this.io.emit('item:update', item);
      console.log(`Broadcasting item update for item ID ${item.id}`);
    }
  }

  /**
   * Mark an item as sold and broadcast the sold event
   * @param item The item to mark as sold
   */
  private async markItemAsSold(item: IItem): Promise<void> {
    item.sold = true;
    await item.save();
    
    if (this.io) {
      this.io.emit('item:sold', {
        itemId: item.id,
        description: item.description,
        finalPrice: item.currentbid,
        winner: item.wininguser
      });
      
      console.log(`Item ${item.id} sold to ${item.wininguser} for ${item.currentbid}`);
    }
  }

  /**
   * Broadcast updated items to all clients
   * Used by the timer to regularly update item information
   * Made public so it can be called after item operations
   */
  public async broadcastItemsUpdate(): Promise<void> {
    try {
      // Get all items from database (both sold and unsold)
      const items = await Item.find({});
      
      if (this.io) {
        this.io.emit('items:update', items);
      }
    } catch (error) {
      console.error('Error broadcasting items update:', error);
    }
  }

  /**
   * Broadcast a new item to all connected clients
   * @param item The new item to broadcast
   */
  public broadcastNewItem(item: IItem): void {
    if (this.io) {
      this.io.emit('item:new', item);
      console.log(`Broadcasting new item: ${item.description} (ID: ${item.id})`);
      
      // Also broadcast updated items list
      this.broadcastItemsUpdate();
    }
  }

  /**
   * Broadcast item removal to all connected clients
   * @param itemId The ID of the removed item
   * @param description The description of the removed item for logging
   */
  public broadcastItemRemoved(itemId: number, description: string): void {
    if (this.io) {
      this.io.emit('item:removed', { 
        itemId, 
        message: `Item ${description} has been removed`
      });
      console.log(`Broadcasting item removal: ${description} (ID: ${itemId})`);
      
      // Also broadcast updated items list
      this.broadcastItemsUpdate();
    }
  }
}

export default new SocketService();