import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

// Import models from their new location
import { Token } from '../models/token';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class SigninService {
  public token!: Token; //to store the jwt authentication token to re-send to the server if needed
  private signinUrl;
  public latitude: number;
  public longitude: number;

  //constructor receives Http object from angular 2 for api calls.
  constructor(private http: HttpClient) {
    //set token if saved in local storage
    this.signinUrl = '/api/authenticate'; //URL to API authenticate service
    this.latitude = 0;
    this.longitude = 0;
    var currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (currentUser) this.token = currentUser;
}
 // Submit User name and Password obtain token object from server that has the username and the jwt token

  login (username: string, password: string, latitude: number, longitude: number) {
    console.log("signin service -> login call");
    this.latitude = latitude;
    this.longitude = longitude;

      return this.http.post<Token>(this.signinUrl, { username: username, password: password, latitude: latitude, longitude: longitude})
              .pipe(
                        catchError(this.handleError)
                      );
  }

// store token object in the service for other services to use when authentication is needed.
  setToken (token: Token): void {
    this.token.username = token.username;
    this.token.token = token.token;
    localStorage.setItem('currentUser', JSON.stringify({username: token.username, token:token.token}));

  }

    logout (): void {
  	//clear token remove user from local storage to log user out
  	this.token.username = '{}';
  	this.token.token = '{}';
  	localStorage.removeItem ('currentUser');
  }

  /**
   * Handle Http operation that failed.
   */
   private handleError (error: HttpErrorResponse) {
    let errMsg:string;
    if (error.error instanceof ErrorEvent) {
    // A client-side or network error occurred. Handle it accordingly.
      errMsg = error.error.message ? error.error.message : error.toString()
      console.error(errMsg);
    } else {
    // The backend returned an unsuccessful response code.
    // The response body may contain clues as to what went wrong,
      errMsg = error.status + ' - ' + error.statusText;
      console.error(errMsg);
    }
    return throwError(()=> new Error (errMsg));
    };

}
