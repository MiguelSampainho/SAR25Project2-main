import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

// Import services from the barrel file
import { AuctionService, SocketService, SigninService } from '../../../../core/services';

// Import models from the barrel file 
import { Item, User, Chat, Marker } from '../../../../core/models';

@Component({
  selector: 'app-auction',
  templateUrl: './auction.component.html',
  styleUrls: ['./auction.component.css'],
  standalone: false
})
export class AuctionComponent implements OnInit, OnDestroy {
  items: Item[]; //array of items to store the items.
  users: User[];
  displayedColumns: string[] //Array of Strings with the table column names
  message: string; // message string
  destination : string; //string with the destination of the current message to send. 
  ChatMessage: string; // message string: string; // message string
  showBid: boolean;  //boolean to control if the show bid form is placed in the DOM
  showMessage: boolean; //boolean to control if the send message form is placed in the DOM
  selectedItem!: Item; //Selected Item
  bidForm! : FormGroup; //FormGroup for the biding
  userName!: string;
  errorMessage: string; //string to store error messages received in the interaction with the api
  mapOptions: google.maps.MapOptions;
  markers: Marker[]; //array to store the markers for the looged users posistions.
  centerLat: number;
  centerLong: number;
  showRemove: boolean;
  soldHistory: string[];
  chats: Chat[]; //array for storing chat messages
  counter: number;
  
  // Subscriptions to manage and clean up
  private subscriptions: Subscription[] = [];

  constructor( private formBuilder: FormBuilder, private router: Router, private socketservice: SocketService, private auctionservice: AuctionService,
   private signinservice: SigninService) {
    this.items = [];
    this.users = [];
    this.soldHistory = [];
    this.chats = [];
    this.counter = 0;
    this.message = "";
    this.destination ="";
    this.ChatMessage = "";
    this.showBid = false;
    this.showMessage = false;
    this.userName = this.signinservice.token.username;
    this.errorMessage = "";
    this.displayedColumns = ['description', 'currentbid', 'buynow', 'remainingtime', 'wininguser', 'owner'];
    this.centerLat = this.signinservice.latitude != null ? this.signinservice.latitude : 38.640026;
    this.centerLong = this.signinservice.longitude != null ? this.signinservice.longitude : -9.155379;
    this.markers = [];
    this.showRemove = false;
    this.mapOptions = {
      center: { lat: this.centerLat, lng: this.centerLong },
      zoom: 10
    };
  }

  ngOnInit() {
    // Get username from the token
    this.userName = this.signinservice.token.username;
    
    // Configure map options
    this.mapOptions = {
      center: { lat: 38.736946, lng: -9.142685 },
      zoom: 10
    };
    
    // Initialize empty markers array
    this.markers = [];
    
    // Initialize display columns for the table
    this.displayedColumns = ['description', 'currentbid', 'buynow', 'remainingtime', 'wininguser', 'owner'];
    
    // Set initial boolean values
    this.showBid = false;
    this.showMessage = false;
    
    // Initialize bid form
    this.bidForm = this.formBuilder.group({
      bid: ['', [Validators.required, Validators.pattern('^[0-9]*$')]]
    });
    
    // Initialize message
    this.message = '';
    this.errorMessage = '';
    
    // Clear these values
    this.destination = "";
    this.ChatMessage = "";
    
    // Connect to socket server
    this.socketservice.connect();
    
    // Register all event subscriptions
    this.setupSocketSubscriptions();
    
    // Debug message for init complete
    console.error("DEBUG - AuctionComponent initialized");
}

  //function called when an item is selected in the view
  onRowClicked(item: Item){
    // Debug the selected item before updating
    console.error("DEBUG - Item clicked:", { 
      id: item.id, 
      description: item.description,
      currentBid: item.currentbid,
      buyNow: item.buynow,
      owner: item.owner,
      sold: item.sold
    });
    
    // Store the complete item object (using object spread to create a copy)
    this.selectedItem = { ...item };
    
    // Make sure the item ID is properly stored
    if (this.selectedItem.id === undefined) {
      console.error("WARNING: Selected item has no ID!");
      // Try to get the ID from the item parameter directly
      this.selectedItem.id = item.id;
      console.error("DEBUG - Attempted to fix missing ID:", this.selectedItem.id);
    }
    
    // Reset error messages
    this.errorMessage = '';
    
    // Show the bid form if the item is not sold
    if (item.sold) {
      this.showBid = false;
      this.message = "This item has already been sold.";
      console.error("DEBUG - Item is already sold, not showing bid form");
    } else {
      this.showBid = true; // makes the bid form appear
      console.error("DEBUG - Showing bid form for item:", this.selectedItem.id);
    }
    
    if (!item.owner.localeCompare(this.userName)) {
      this.showRemove = true;
      this.showMessage = false;
    }
    else {
      this.showRemove = false;
      this.destination = this.selectedItem.owner;
      this.showMessage = true;
    }
  }

  //function called when a received message is selected. 
  onMessageSender(ClickedChat: Chat) {
    //destination is now the sender of the selected received message. 
  }

  // function called when the submit bid button is pressed
   submit() {
    // Get the bid value from the form
    const bidControl = this.bidForm.get('bid');
    const bid = bidControl ? Number(bidControl.value) : 0;
    
    // Validate that we have a selected item and a valid bid value
    if (!this.selectedItem) {
      this.errorMessage = "No item selected";
      console.error("DEBUG - No item selected for bidding");
      return;
    }
    
    if (isNaN(bid) || bid <= 0) {
      this.errorMessage = "Please enter a valid bid amount";
      console.error("DEBUG - Invalid bid amount:", bid);
      return;
    }
    
    // Debug check - make sure item has an ID
    console.error("DEBUG - Bidding on item:", { 
      id: this.selectedItem.id,
      description: this.selectedItem.description, 
      currentBid: this.selectedItem.currentbid 
    });
    
    // Emit the send:bid event with the item_id and bid
    this.socketservice.sendEvent('send:bid', {
      item_id: this.selectedItem.id,
      bid: bid
    });
    
    console.error("DEBUG - Sent bid event with data:", { 
      item_id: this.selectedItem.id, 
      bid: bid 
    });
    
    // Reset the form
    this.bidForm.reset();
  }
  //function called when the user presses the send message button
  sendMessage(){
    console.log("Message  = ", this.ChatMessage);
  }

  //function called when the cancel bid button is pressed.
   cancelBid(){
   	this.bidForm.reset(); //clears bid value
   }

   //function called when the buy now button is pressed.
   buyNow() {
     // Validate that we have a selected item
     if (!this.selectedItem) {
       this.errorMessage = "No item selected";
       console.error("DEBUG - No item selected for buy now");
       return;
     }
     
     console.error("DEBUG - Buy now request for item:", { 
       id: this.selectedItem.id,
       description: this.selectedItem.description,
       buyNowPrice: this.selectedItem.buynow
     });
     
     // Emit buy:now event with the item id
     this.socketservice.sendEvent('buy:now', {
       item_id: this.selectedItem.id
     });
     
     console.error("DEBUG - Sent buy:now event with data:", { 
       item_id: this.selectedItem.id
     });
     
     // Provide feedback to the user
     this.message = `Buy now request sent for ${this.selectedItem.description}`;
     
     // Reset bid form
     this.bidForm.reset();
  }
//function called when the remove item button is pressed.
  removeItem() {
    if (!this.selectedItem) {
      this.errorMessage = "No item selected";
      return;
    }
    
    console.log("Removing item:", this.selectedItem);
    
    // Use the auction service to remove the item
    this.auctionservice.removeItem(this.selectedItem.id)
      .subscribe({
        next: (result) => {
          console.log("Item removed successfully:", result);
          this.message = `Item "${this.selectedItem.description}" removed successfully`;
          
          // Reset the form and selection
          this.showBid = false;
          this.showRemove = false;
          this.bidForm.reset();
        },
        error: (error) => {
          console.error("Error removing item:", error);
          this.errorMessage = typeof error === 'string' ? error : 'Failed to remove item';
        }
      });
  }

  /**
   * Calculate the time progress percentage for the auction item
   * @param item The auction item
   * @returns A number between 0-100 representing progress percentage
   */
  getTimeProgress(item: Item): number {
    if (!item || !item.remainingtime) {
      return 0;
    }

    const maxTime = 3600000; // Assuming initial time is 1 hour (3600000 ms)
    const remainingTime = item.remainingtime;
    
    // Calculate elapsed time as a percentage
    const elapsedPercentage = ((maxTime - remainingTime) / maxTime) * 100;
    
    // Return a percentage value between 0-100
    return Math.min(Math.max(elapsedPercentage, 0), 100);
  }

  /**
   * Determine the color of the progress bar based on remaining time
   * @param item The auction item
   * @returns Material color for the progress bar
   */
  getTimeProgressColor(item: Item): string {
    if (!item || !item.remainingtime) {
      return 'warn'; // Red when no time or item data
    }

    // More than 50% time remaining - show green
    if (item.remainingtime > 1800000) {
      return 'primary'; // Blue
    } 
    // Between 25% and 50% time remaining - show accent (amber)
    else if (item.remainingtime > 900000) {
      return 'accent';
    } 
    // Less than 25% time remaining - show red
    else {
      return 'warn'; // Red
    }
  }

  /**
   * Format the remaining time to be displayed in a human-readable format
   * @param milliseconds The remaining time in milliseconds
   * @returns Formatted time string (e.g., "10m 30s")
   */
  formatRemainingTime(milliseconds: number): string {
    if (!milliseconds) {
      return 'No time left';
    }
    
    // Calculate minutes and seconds
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions to prevent memory leaks
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  /**
   * Set up all socket event subscriptions
   */
  private setupSocketSubscriptions() {
    //subscribe to the server side regularly (each second) items:update event
    const updateItemsSubscription = this.socketservice.getEvent("update:items")
                    .subscribe(
                      data =>{
                        let receiveddata = data as Item[];
                          if (this.items){
                            this.items = receiveddata;
                          }
                      }
                    );
    this.subscriptions.push(updateItemsSubscription);

    //subscribe to the new user logged in event that must be sent from the server when a client logs in 
        const newUserSubscription = this.socketservice.getEvent("new:user")
          .subscribe({
            next: data => {
              // Check if this user already has a marker
              const existingMarkerIndex = this.markers.findIndex(marker => marker.label === data.username);
              
              if (existingMarkerIndex === -1) {
                // Only add a new marker if one doesn't already exist for this user
                const newMarker = new Marker(
                  { lat: data.latitude, lng: data.longitude },
                  data.username
                );
                this.markers.push(newMarker);
              }
            },
            error: err => {
              console.error("Error in new:user subscription:", err);
            }
          });
        this.subscriptions.push(newUserSubscription);

    //subscribe to the user logged out event that must be sent from the server when a client logs out 
        const userLeftSubscription = this.socketservice.getEvent("user:left")
          .subscribe({
            next: data => {
              // Remove the marker for the logged-out user
              const username = data.username;
              // Find and remove the marker for the user who left
              this.markers = this.markers.filter(marker => marker.label !== username);
            },
            error: err => {
              console.error("Error in user:left subscription:", err);
            }
          });
        this.subscriptions.push(userLeftSubscription);
        
    //subscribe to individual item update events
        const itemUpdateSubscription = this.socketservice.getEvent("item:update")
          .subscribe({
            next: (updatedItem) => {
              // Find and update the item in the local array
              const index = this.items.findIndex(item => item.id === updatedItem.id);
              if (index !== -1) {
                this.items[index] = updatedItem;
                
                // If this is the currently selected item, update it
                if (this.selectedItem && this.selectedItem.id === updatedItem.id) {
                  this.selectedItem = updatedItem;
                }
              }
            },
            error: (err) => {
              console.error("Error in item:update subscription:", err);
            }
          });
        this.subscriptions.push(itemUpdateSubscription);
        
        // Subscribe to items:update for batch updates
        const itemsUpdateSubscription = this.socketservice.getEvent("items:update")
          .subscribe({
            next: (items) => {
              this.items = items;
            },
            error: (err) => {
              console.error("Error in items:update subscription:", err);
            }
          });
        this.subscriptions.push(itemsUpdateSubscription);
        
        // Subscribe to item sold events
        const itemSoldSubscription = this.socketservice.getEvent("item:sold")
          .subscribe({
            next: (soldData) => {
              // Debug log for item sold event
              console.error("DEBUG - Received item:sold event:", soldData);
              
              // Add to sold history
              this.soldHistory.push(`${soldData.description} sold to ${soldData.winner} for $${soldData.finalPrice}`);
              
              // Find the item in the items array and mark as sold
              const index = this.items.findIndex(item => item.id === soldData.itemId);
              if (index !== -1) {
                this.items[index].sold = true;
                console.error("DEBUG - Marked item as sold in local array:", this.items[index]);
              } else {
                console.error("DEBUG - Could not find item in local array:", soldData.itemId);
              }
              
              // If this was the selected item, reset the bid form
              if (this.selectedItem && this.selectedItem.id === soldData.itemId) {
                this.showBid = false;
                this.bidForm.reset();
                this.message = `Item "${soldData.description}" has been sold to ${soldData.winner} for $${soldData.finalPrice}`;
                console.error("DEBUG - Reset bid form for sold item");
              }
            },
            error: (err) => {
              console.error("Error in item:sold subscription:", err);
            }
          });
        this.subscriptions.push(itemSoldSubscription);
  }
  
  /**
   * Handles user logout
   * This method calls the SigninService logout method and redirects to login page
   */
  logout() {
    // Disconnect from WebSocket server to prevent reconnection attempts
    this.socketservice.disconnect();
    
    // Call the logout function in the SigninService to clear the token
    this.signinservice.logout();
    
    // Navigate to the login page
    this.router.navigate(['/signin']);
    
    console.error("DEBUG - User logged out");
  }
}
