import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

// Import the components from their new locations
import { SigninComponent } from './components/signin/signin.component';
import { RegisterComponent } from './components/register/register.component';

@NgModule({
  declarations: [
    SigninComponent,
    RegisterComponent
  ],
  imports: [
    SharedModule,
    RouterModule
  ],
  exports: [
    SigninComponent,
    RegisterComponent
  ]
})
export class AuthModule { }