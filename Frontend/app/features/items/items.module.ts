import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

// Import the components from their new locations
import { InsertitemComponent } from './components/insertitem/insertitem.component';

@NgModule({
  declarations: [
    InsertitemComponent
  ],
  imports: [
    SharedModule,
    RouterModule
  ],
  exports: [
    InsertitemComponent
  ]
})
export class ItemsModule { }