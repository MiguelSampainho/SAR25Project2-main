import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MaterialModule } from '../material/material.module';

@NgModule({
  declarations: [
    // Add shared components, directives, and pipes here as needed
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule
  ],
  exports: [
    // Export shared modules, components, directives, and pipes
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule
  ]
})
export class SharedModule { }