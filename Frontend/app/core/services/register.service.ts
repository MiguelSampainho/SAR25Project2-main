import { Injectable } from '@angular/core';
import {throwError,  Observable } from 'rxjs';
import { HttpClient, HttpHeaders, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})

export class RegisterService {
  private registerUrl
  
  constructor(private http: HttpClient) { 
  	this.registerUrl = "/api/newuser";
  }

  // Http POST call to the api to submit the new user data returns a boolean observer to indicate success
 submitNewUser (user: any) {
              
              return this.http.post<any>(this.registerUrl, user)
                     .pipe(
                        catchError(this.handleError)
                      );
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
