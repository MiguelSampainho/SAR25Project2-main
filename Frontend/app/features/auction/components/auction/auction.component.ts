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
    this.centerLat = this.signinservice.latitude != null ? this.signinservice.latitude : 0.0;
    this.centerLong = this.signinservice.longitude != null ? this.signinservice.longitude : 0.0;
    this.markers = [];
    this.showRemove = false;
    this.mapOptions = {
      center: { lat: this.centerLat, lng: this.centerLong },
      zoom: 10
    };
  }

ngOnInit(): void {
  	 this.message= "Hello " + this.userName + "! Welcome to the SAR auction site.";

  	 //create bid form
  	 this.bidForm = this.formBuilder.group({
      bid: ['', Validators.compose([Validators.required,Validators.pattern("^[0-9]*$")])]
  	 });


  	 // Get initial item data from the server api using http call in the auctionservice
     this.auctionservice.getItems()
        .subscribe({next: result => {
          let receiveddata = result as Item[]; // cast the received data as an array of items (must be sent like that from server)
            this.items = receiveddata;
            console.log ("getItems Auction Component -> received the following items: ", receiveddata);
        },
        error: error => this.errorMessage = <any>error });

     // Get initial list of logged in users for googleMaps using http call in the auctionservice
      this.auctionservice.getUsers()
        .subscribe({
          next: result => {
          let receiveddata = result as User[]; // cast the received data as an array of users (must be sent like that from server)
            console.log("getUsers Auction Component -> received the following users: ", receiveddata);
            // Clear existing markers first
            this.markers = [];
            // Create a marker for each logged-in user
            receiveddata.forEach(user => {
              if (user.islogged) {
                const newMarker = new Marker(
                  { lat: user.latitude, lng: user.longitude },
                  user.username
                );
                this.markers.push(newMarker);
              }
            });
          },
          error: error => this.errorMessage = <any>error });

  //subscribe to the incoming websocket events

  //example how to subscribe to the server side regularly (each second) items:update event
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
      console.log("Setting up subscription for new:user events");
      const newUserSubscription = this.socketservice.getEvent("new:user")
        .subscribe({
          next: data => {
            console.log("%c📱 New user logged in!", "background: #4CAF50; color: white; padding: 5px; border-radius: 5px;");
            console.log("Username:", data.username);
            console.log("Location:", { lat: data.latitude, lng: data.longitude });
            
            // Create a new marker for the logged-in user
            const newMarker = new Marker(
              { lat: data.latitude, lng: data.longitude },
              data.username
            );
            // Add the new marker to the markers array
            this.markers.push(newMarker);
          },
          error: err => {
            console.error("Error in new:user subscription:", err);
          }
        });
      this.subscriptions.push(newUserSubscription);

  //subscribe to the user logged out event that must be sent from the server when a client logs out 
      console.log("Setting up subscription for user:left events");
      const userLeftSubscription = this.socketservice.getEvent("user:left")
        .subscribe({
          next: data => {
            console.log("%c👋 User logged out!", "background: #F44336; color: white; padding: 5px; border-radius: 5px;");
            console.log("Username:", data.username);
            
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
      
      // Direct connection to socket events (backup approach)
      this.socketservice.socket.on('new:user', (data: any) => {
        console.log("%c🔄 DIRECT: New user logged in!", "background: blue; color: white; padding: 5px; border-radius: 5px;");
        console.log("Data:", data);
      });
      
      this.socketservice.socket.on('user:left', (data: any) => {
        console.log("%c🔄 DIRECT: User logged out!", "background: orange; color: white; padding: 5px; border-radius: 5px;");
        console.log("Data:", data);
      });

  //subscribe to individual item update events
      console.log("Setting up subscription for item:update events");
      const itemUpdateSubscription = this.socketservice.getEvent("item:update")
        .subscribe({
          next: (updatedItem) => {
            console.log("%c🔄 Item updated!", "background: purple; color: white; padding: 5px; border-radius: 5px;");
            console.log("Updated item:", updatedItem);
            
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
            console.log("%c📊 All items updated!", "background: teal; color: white; padding: 5px; border-radius: 5px;");
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
            console.log("%c💰 Item sold!", "background: gold; color: black; padding: 5px; border-radius: 5px;");
            console.log("Sold item:", soldData);
            
            // Add to sold history
            this.soldHistory.push(`${soldData.description} sold to ${soldData.winner} for $${soldData.finalPrice}`);
            
            // Find the item in the items array and mark as sold
            const index = this.items.findIndex(item => item.id === soldData.itemId);
            if (index !== -1) {
              this.items[index].sold = true;
            }
            
            // If this was the selected item, reset the bid form
            if (this.selectedItem && this.selectedItem.id === soldData.itemId) {
              this.showBid = false;
              this.bidForm.reset();
              this.message = `Item "${soldData.description}" has been sold to ${soldData.winner} for $${soldData.finalPrice}`;
            }
          },
          error: (err) => {
            console.error("Error in item:sold subscription:", err);
          }
        });
      this.subscriptions.push(itemSoldSubscription);
    
  //subscribe to a receive:message event to receive message events sent by the server

  }

   logout(){
    //call the logout function in the signInService to clear the token in the browser
    this.signinservice.logout();  // Tem que estar em primeiro para ser apagado o token e nao permitir mais reconnects pelo socket
  	//perform any needed logout logic here
  	this.socketservice.disconnect();
    //navigate back to the log in page
    this.router.navigate(['/signin']);
  }

  //function called when an item is selected in the view
  onRowClicked(item: Item){
  	console.log("Selected item = ", item);
  	this.selectedItem = item;
  	this.showBid = true; // makes the bid form appear
    
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
    const bid = Number(this.bidForm.value.bid);
    console.log("Submitting bid:", bid);
    
    // Validate that we have a selected item and a valid bid value
    if (!this.selectedItem) {
      this.errorMessage = "No item selected";
      return;
    }
    
    if (isNaN(bid) || bid <= 0) {
      this.errorMessage = "Please enter a valid bid amount";
      return;
    }
    
    // Emit the send:bid event with the item_id and bid
    this.socketservice.sendEvent('send:bid', {
      item_id: this.selectedItem.id,
      bid: bid
    });
    
    // Reset the form
    this.bidForm.reset();
    this.message = `Bid of ${bid} submitted for ${this.selectedItem.description}`;
    
    // Subscribe to bid error events
    const bidErrorSubscription = this.socketservice.getEvent("bid:error")
      .subscribe({
        next: (error) => {
          console.error("Bid error:", error);
          this.errorMessage = error.message || "Failed to process bid";
        },
        error: (err) => {
          console.error("Error subscribing to bid errors:", err);
        }
      });
    this.subscriptions.push(bidErrorSubscription);
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
     // Check if we have a selected item
     if (!this.selectedItem) {
       this.errorMessage = "No item selected";
       return;
     }
     
     console.log("Buy now for item:", this.selectedItem.id);
     
     // Emit the buy:now event with the item_id
     this.socketservice.sendEvent('buy:now', {
       item_id: this.selectedItem.id
     });
     
     this.message = `Buy now requested for ${this.selectedItem.description}`;
     
     // Subscribe to buy now error events
     const buyNowErrorSubscription = this.socketservice.getEvent("buynow:error")
       .subscribe({
         next: (error) => {
           console.error("Buy now error:", error);
           this.errorMessage = error.message || "Failed to process buy now request";
         },
         error: (err) => {
           console.error("Error subscribing to buy now errors:", err);
         }
       });
     this.subscriptions.push(buyNowErrorSubscription);
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

}
