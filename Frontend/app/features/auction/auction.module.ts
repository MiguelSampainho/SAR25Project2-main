import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { GoogleMapsModule } from '@angular/google-maps';

// Import the components from their new locations
import { AuctionComponent } from './components/auction/auction.component';

@NgModule({
  declarations: [
    AuctionComponent
  ],
  imports: [
    SharedModule,
    RouterModule,
    GoogleMapsModule
  ],
  exports: [
    AuctionComponent
  ]
})
export class AuctionModule { }