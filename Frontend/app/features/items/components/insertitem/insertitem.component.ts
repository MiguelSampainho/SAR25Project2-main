import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormControl, Validators } from '@angular/forms';

// Import services and models from barrel files
import { InsertitemService, SigninService } from '../../../../core/services';
import { Item } from '../../../../core/models';

@Component({
  selector: 'app-insertitem',
  templateUrl: './insertitem.component.html',
  styleUrls: ['./insertitem.component.css'],
  standalone: false
})
export class InsertitemComponent implements OnInit {
  errorMessage : string; // string to store error messages
  itemForm!: FormGroup;
  userName!: string;

  constructor(
  	private insertitemservice: InsertitemService, private router: Router, private signinservice: SigninService
  ) {
  	  this.errorMessage = "";
  	  this.userName = this.signinservice.token.username;
  	}

  ngOnInit(): void {
  	 this.itemForm = new FormGroup({
      description: new FormControl ('', [Validators.required]),
      currentbid: new FormControl ('', [Validators.required, Validators.pattern("^[0-9]*$")]), 
      buynow: new FormControl ('', [Validators.required, Validators.pattern("^[0-9]*$")]), 
      remainingtime: new FormControl ('', [Validators.required, Validators.pattern("^[0-9]*$")]), 
      owner: new FormControl ('', [Validators.required])
  	 });
     this.itemForm.patchValue({owner: this.userName});
     //this.itemForm.setValue({owner: this.userName});
     console.log(this.itemForm.value);
  }

  get f(){

    return this.itemForm.controls;

  }

  submit(){
  	 this.insertitemservice.submitNewItem(this.itemForm.value)
   	   .subscribe({
   	   	  next:result => {
   	   	  	 	console.log ('item inserted succcessfully',result);
   	   	  	 	//registration successfull navigate to login page
   	   	  	 	this.router.navigate(['/auction']);
   	   	  }, //callback to cath errors thrown bby the Observable in the service
   	   	  error: error => {
   	   	  	this.errorMessage = <any>error;
   	   	  }
        });
  }

  clearForm() {
  	//clears what is appering in the form
  	this.itemForm.reset();

  }

  logout(){
    
  }

}
