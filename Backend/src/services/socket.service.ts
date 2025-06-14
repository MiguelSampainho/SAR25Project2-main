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
      
      // Check if the user already has a socket connection
      const existingSocketId = this.socketIDbyUsername.get(username);
      if (existingSocketId) {
        // User already connected, handle this as needed
        // If we reach here, it means the user has multiple connections
        // We'll use the most recent one
        // Get the old socket
        const oldSocket = this.io?.sockets.sockets.get(existingSocketId);
        if (oldSocket && oldSocket.id !== socket.id) {
          // Clean up the old socket if it exists and is different
          this.usernamebySocketID.delete(oldSocket.id);
        }
      }
      
      // Store client in the maps (overwriting any existing entry)
      this.socketIDbyUsername.set(username, socket.id);
      this.usernamebySocketID.set(socket.id, username);

      // Handle new user event
      socket.on('newUser:username', async (_data) => {
        const username = socket.data.decoded_token.username;
        
        try {
          // Update user in database with latest connection info
          const user = await User.findOne({ username });
          if (user) {
            // Make sure user is marked as logged in
            user.islogged = true;
            await user.save();
          }
        } catch (error) {
          console.error(`Error updating user connection status for ${username}:`, error);
        }
      });

      // Handle bid event
      socket.on('send:bid', async (data) => {
        try {
          const username = socket.data.decoded_token.username;
          const { item_id, bid } = data;
          
          // DEBUG: Log the received bid data
          console.error("DEBUG - Received bid:", { username, item_id, bid }); // DEBUG message, can be removed later
          
          // Find the item in the database
          const item = await Item.findOne({ id: item_id });
          
          if (!item) {
            console.error("DEBUG - Item not found:", { item_id, query_result: "null" }); // DEBUG message, can be removed later
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
          
          // Broadcast the item update to all clients
          this.broadcastItemUpdate(item);
          
          // If the bid matches the buy now price, mark item as sold
          if (item.currentbid >= item.buynow) {
            console.error("DEBUG - Bid meets buy now price, marking as sold:", {
              item_id: item.id,
              bid: item.currentbid,
              buyNow: item.buynow
            });
            await this.markItemAsSold(item);
          }
          
          // Also send a specific event back to the bidder confirming the bid was successful
          socket.emit('bid:success', {
            item_id: item.id,
            bid: bid,
            message: `Your bid of $${bid} was successful.`
          });
        } catch (error) {
          // DEBUG: This error handling can be simplified in production
          console.error("DEBUG - Error processing bid:", error); // DEBUG message, can be removed later
          
          // Send error notification back to the client who made the bid
          socket.emit('bid:error', { 
            message: error instanceof Error ? error.message : 'Unknown error processing bid'
          });
        }
      });

      // Handle buy now event 
      socket.on('buy:now', async (data) => {
        try {
          const username = socket.data.decoded_token.username;
          const { item_id } = data;
          
          // DEBUG: Log the buy now request
          console.error("DEBUG - Received buy now:", { username, item_id }); // DEBUG message, can be removed later
          
          // Find the item in the database
          const item = await Item.findOne({ id: item_id });
          
          if (!item) {
            console.error("DEBUG - Item not found for buy now:", { item_id }); // DEBUG message, can be removed later
            throw new Error(`Item with ID ${item_id} not found`);
          }
          
          // Check if item is already sold
          if (item.sold) {
            throw new Error('This item has already been sold');
          }
          
          // Check if the buyer is the owner
          if (item.owner === username) {
            throw new Error('You cannot buy your own item');
          }
          
          // Update the item - set current bid to buy now price
          item.currentbid = item.buynow;
          item.wininguser = username;
          
          // Mark as sold
          item.sold = true;
          
          // Save the updated item
          await item.save();
          
          // Log the purchase for debugging
          console.error("DEBUG - Item purchased with Buy Now:", { item_id, username, price: item.buynow });
          
          // Broadcast the item update to all clients
          if (this.io) {
            this.io.emit('item:update', item);
          
            // Broadcast the item sold event
            this.io.emit('item:sold', {
              itemId: item.id,
              description: item.description,
              winner: username,
              finalPrice: item.buynow
            });
              
            // Broadcast to the room
            this.io.emit('new:chat', {
              sender: 'System',
              destination: 'all',
              message: `${username} has purchased "${item.description}" for $${item.buynow}.`
            });
          } else {
            console.error("DEBUG - Cannot emit events: io is null");
          }
        } catch (error) {
          console.error("Error processing buy now:", error);
          // Send error notification back to the client
          socket.emit('buynow:error', { 
            message: error instanceof Error ? error.message : 'Unknown error processing buy now'
          });
        }
      });
      
      // Handle message event
      socket.on('send:message', (_chat) => {
        // Process the message
      });

      // Handle disconnection
      socket.on('disconnect', async () => {
        const username = this.usernamebySocketID.get(socket.id);
        
        if (username) {
          // Update user's logged in status in the database
          try {
            const user = await User.findOne({ username });
            if (user) {
              user.islogged = false;
              await user.save();
              
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
        
        // Process each unsold item
        for (const item of unsoldItems) {
          // Decrement remaining time by 1 second
          item.remainingtime = Math.max(0, item.remainingtime - 1);
          
          // Check if the item should be marked as sold
          if (item.remainingtime === 0 && !item.sold) {
            item.sold = true;
            
            // Emit item:sold event with item data
            if (this.io) {
              this.io.emit('item:sold', {
                itemId: item.id,
                description: item.description,
                finalPrice: item.currentbid,
                winner: item.wininguser
              });
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
    }
  }

  /**
   * Broadcast user logged-out event to all clients
   * @param username The username of the logged out user
   */
  public userLoggedOutBroadcast(username: string): void {
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

  /* This processBid method is redundant since the logic is already implemented directly in 
   * the send:bid event handler. Removing to eliminate duplication.
   */

  /**
   * Broadcast an item update to all connected clients
   * @param item The updated item to broadcast
   */
  private broadcastItemUpdate(item: IItem): void {
    if (this.io) {
      this.io.emit('item:update', item);
    }
  }

  /**
   * Mark an item as sold and broadcast the sold event
   * @param item The item to mark as sold
   */
  private async markItemAsSold(item: IItem): Promise<void> {
    item.sold = true;
    await item.save();
    
    console.error("DEBUG - Marking item as sold:", { 
      itemId: item.id, 
      description: item.description, 
      winner: item.wininguser,
      finalPrice: item.currentbid
    });
    
    if (this.io) {
      // First update the item
      this.io.emit('item:update', item);
      
      // Then emit the sold event
      this.io.emit('item:sold', {
        itemId: item.id,
        description: item.description,
        finalPrice: item.currentbid,
        winner: item.wininguser || 'Unknown'
      });
      
      // Also broadcast a system message
      this.io.emit('new:chat', {
        sender: 'System',
        destination: 'all',
        message: `Item "${item.description}" has been sold to ${item.wininguser || 'Unknown'} for $${item.currentbid}.`
      });
    } else {
      console.error("DEBUG - Cannot emit events: io is null");
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
      // DEBUG: This error handling can be simplified in production
      console.error('DEBUG - Error broadcasting items update:', error); // DEBUG message, can be removed later
    }
  }

  /**
   * Broadcast a new item to all connected clients
   * @param item The new item to broadcast
   */
  public broadcastNewItem(item: IItem): void {
    if (this.io) {
      this.io.emit('item:new', item);
      
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
      
      // Also broadcast updated items list
      this.broadcastItemsUpdate();
    }
  }
}

export default new SocketService();