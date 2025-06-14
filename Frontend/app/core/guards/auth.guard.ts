import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { SigninService } from '../services/signin.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(private router: Router) { }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
  if (localStorage.getItem('currentUser')) {
            // logged in so return true Current User contains user information and the JWT token
            console.log ('AuthGuard returned true, currentUser= ', localStorage.getItem('currentUser'));
            return true;
        }
 
        // not logged in so redirect to login page
        console.log ('AuthGuard returned false');
        this.router.navigate(['/signin']);
        return false;
  }
}