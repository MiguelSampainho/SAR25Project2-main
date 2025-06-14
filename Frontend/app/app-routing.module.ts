import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Import components from their new locations
import { SigninComponent } from './features/auth/components/signin/signin.component';
import { RegisterComponent } from './features/auth/components/register/register.component';
import { AuctionComponent } from './features/auction/components/auction/auction.component';
import { InsertitemComponent } from './features/items/components/insertitem/insertitem.component';

// Import the auth guard from the barrel file
import { AuthGuard } from './core/guards';

// Define the routes
const routes: Routes = [
  {
    path: '',
    redirectTo: 'signin',
    pathMatch: 'full'
  },
  {
    path: 'signin',
    component: SigninComponent
  },
  {
    path: 'register',
    component: RegisterComponent
  },
  {
    path: 'insertitem',
    component: InsertitemComponent, 
    canActivate: [AuthGuard]         // can only route here after successful login
  },
  {
    path: 'auction',
    component: AuctionComponent,
    canActivate: [AuthGuard]        // can only route here after successful login
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
