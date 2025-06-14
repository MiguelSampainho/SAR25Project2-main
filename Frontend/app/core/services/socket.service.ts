import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Socket } from 'ngx-socket-io';
import { SigninService } from './signin.service';

// Import models from their new location
import { Chat } from '../models/chat';
import { Item } from '../models/item';
import { Useronline } from '../models/useronline';

@Injectable({
  providedIn: 'root'
})
export class SocketService {  
 
  private url = window.location.origin;
  
  // Expose socket as public accessor to allow direct access in components
  constructor(private signInService: SigninService, public socket: Socket) { }
 
  /**
   * Connect to WebSocket with proper authentication
   * Uses query params since that's what the backend expects
   */
  connect() {
    // Remove all existing listeners to prevent duplications
    this.socket.removeAllListeners();
    
    // Disconnect first to ensure clean reconnection
    if (this.socket.ioSocket.connected) {
      this.socket.disconnect();
    }
    
    // Set authentication token in query parameters to match backend expectations
    this.socket.ioSocket.io.opts.query = { token: this.signInService.token.token };
    
    // Set reconnection settings
    this.socket.ioSocket.io.opts.reconnectionAttempts = 5;
    this.socket.ioSocket.io.opts.reconnectionDelay = 1000;
    this.socket.ioSocket.io.opts.timeout = 10000;
    
    // Connect with new options
    this.socket.connect();
    
    // Setup event handlers for connection status
    this.socket.on('connect', () => {
      // Tell the server who we are after connection
      this.sendEvent('newUser:username', { username: this.signInService.token.username });
    });
    
    // Setup reconnection error handler
    this.socket.on('connect_error', (error: any) => {
      console.error('Socket connection error:', error);
    });
    
    this.socket.on('disconnect', (reason) => {
      // Socket disconnected
    });
  }

  /**
   * Safely disconnect from the socket server
   */
  disconnect() {
    this.socket.disconnect();
  }

  /**
   * Send an event to the WebSocket server
   * @param EventName The name of the event
   * @param Data The data to send with the event
   */
  sendEvent(EventName: string, Data: any) {
    console.error(`DEBUG - Sending socket event: ${EventName}`, Data);
    this.socket.emit(EventName, Data);
  }

  /**
   * Create an observable for a WebSocket event
   * @param Eventname The name of the event to listen for
   * @returns Observable that emits when the event occurs
   */
  getEvent(Eventname: string): Observable<any> {
    console.error(`DEBUG - Setting up listener for event: ${Eventname}`);
    
    // Create a simpler implementation that doesn't cause duplicate event handling
    return new Observable(observer => {
      const handler = (data: any) => {
        console.error(`DEBUG - Received event: ${Eventname}`, data);
        observer.next(data);
      };
      
      // Add the event listener
      this.socket.on(Eventname, handler);
      
      // Return cleanup function to remove listener when subscription is disposed
      return () => {
        console.error(`DEBUG - Removing listener for event: ${Eventname}`);
        this.socket.off(Eventname, handler);
      };
    });
  }
}
