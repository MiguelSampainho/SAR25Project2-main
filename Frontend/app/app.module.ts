import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';

// Import routing module
import { AppRoutingModule } from './app-routing.module';

// Import the root component
import { AppComponent } from './app.component';

// Import feature and core modules
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';
import { AuthModule } from './features/auth/auth.module';
import { AuctionModule } from './features/auction/auction.module';
import { ItemsModule } from './features/items/items.module';

// The socket cannot start at bootstrap since the jwt token is still not available
const config: SocketIoConfig = { url: window.location.origin, options: {autoConnect: false} };

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    SocketIoModule.forRoot(config),
    
    // Core module - contains singleton services
    CoreModule,
    
    // Shared module
    SharedModule,
    
    // Feature modules
    AuthModule,
    AuctionModule,
    ItemsModule
  ],
  providers: [
    provideHttpClient(withInterceptorsFromDi())
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
