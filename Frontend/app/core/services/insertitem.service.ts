import { Injectable } from '@angular/core';
import {throwError,  Observable } from 'rxjs';
import { HttpClient, HttpHeaders, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';
import { SigninService } from './signin.service';

@Injectable({
  providedIn: 'root'
})
export class InsertitemService {
  private newitemUrl
  constructor(private http: HttpClient, private signinservice: SigninService) { 
    this.newitemUrl = "/api/newitem";
  }

  // Http POST call to the api to submit the new user data returns a boolean observer to indicate success
  submitNewItem (item: any) {
  
    let headers = new HttpHeaders({ 'Authorization': 'Bearer ' + this.signinservice.token.token }); // insert tokern in the requests
    let options = { headers: headers };
               
    return this.http.post<any>(this.newitemUrl, item, options)
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
