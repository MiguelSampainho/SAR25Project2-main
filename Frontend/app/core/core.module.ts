import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';

// Import services using the barrel file
import { 
  AuctionService, 
  InsertitemService, 
  RegisterService, 
  SigninService, 
  SocketService 
} from './services';

// Import guards using the barrel file
import { AuthGuard } from './guards';

@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ],
  providers: [
    AuctionService,
    InsertitemService,
    RegisterService,
    SigninService,
    SocketService,
    AuthGuard
  ]
})
export class CoreModule { 
  // Prevent the CoreModule from being imported multiple times
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule is already loaded. Import it in the AppModule only.');
    }
  }
}