import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormControl, Validators } from '@angular/forms';

// Import services and models from barrel files
import { SigninService, SocketService } from '../../../../core/services';
import { Token } from '../../../../core/models';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.css'],
  standalone: false
})


export class SigninComponent implements OnInit {
  errorMessage : string; // string to store error messages
  loginForm!: FormGroup;
  latitude: number;
  longitude: number;

  constructor(
  	private router: Router, private signinservice: SigninService, private socketservice: SocketService
  ) {
  		this.errorMessage = "";
      this.latitude = 0;
      this.longitude = 0;
    }

  ngOnInit(): void {
  	 this.loginForm = new FormGroup({
      username: new FormControl ('', [Validators.required]),
      password: new FormControl('', Validators.required)
  	 });
  }

  get f(){

    return this.loginForm.controls;

  }

  submit() {
    if (!this.loginForm.valid) {
      console.log(this.loginForm.controls['password'].errors);
      return;
    }
    
    this.errorMessage = "";
    const username = this.loginForm.value.username;
    const password = this.loginForm.value.password;

    // First try to get geolocation data
    if ('geolocation' in navigator) {
      // Show loading state could be added here
      
      navigator.geolocation.getCurrentPosition(
        // Success callback
        (position) => {
          this.latitude = position.coords.latitude;
          this.longitude = position.coords.longitude;
          console.log("Geolocation obtained: ", this.longitude, this.latitude);
          this.authenticateUser(username, password);
        },
        // Error callback
        (err) => {
          console.warn("Geolocation error:", err.message);
          // Continue with default coordinates
          this.authenticateUser(username, password);
        },
        // Options
        { timeout: 5000 }
      );
    } else {
      console.warn("Geolocation not available in this browser");
      this.authenticateUser(username, password);
    }
  }

  /**
   * Handles the authentication flow with the server
   */
  private authenticateUser(username: string, password: string): void {
    this.signinservice.login(username, password, this.latitude, this.longitude)
      .subscribe({
        next: (result: Token) => {
          // Store the received JWT token
          this.signinservice.setToken(result);
          
          // Connect websocket and register user
          this.socketservice.connect();
          this.socketservice.sendEvent('newUser:username', { username });
          
          console.log('Authentication successful, navigating to auction');
          this.router.navigate(['/auction']);
        },
        error: (error) => {
          this.errorMessage = error;
          console.error('Authentication error:', this.errorMessage);
          this.loginForm.get('username')?.setErrors({ invalid: true });
        }
      });
  }
}
