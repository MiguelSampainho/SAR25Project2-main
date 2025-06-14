import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormControl, Validators } from '@angular/forms';

// Import services and models from barrel files
import { RegisterService } from '../../../../core/services';
import { User } from '../../../../core/models';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  standalone: false
})
export class RegisterComponent implements OnInit {
   errorMessage : string; // string to store error messages	
   userForm!: FormGroup;

   //pass the relevant services in to the component
  constructor( 
  	private registerservice: RegisterService, private router: Router
  ) { 
      this.errorMessage = "";
    }

  ngOnInit(): void {
  	 this.userForm = new FormGroup({
      name: new FormControl ('', [Validators.required]),
      username: new FormControl ('', [Validators.required]),
      email: new FormControl ('', [Validators.required,Validators.pattern(/^(([^<>+()\[\]\\.,;:\s@"-#$%&=]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,3}))$/)]),
      password: new FormControl ('', [Validators.required])
  	 });
  }
  
  get f(){

    return this.userForm.controls;

  }

  submit(){
     console.log ('registration succcessfull',this.userForm.value);
  	 this.registerservice.submitNewUser(this.userForm.value)
   	   .subscribe({
   	   	  next: user => {
   	   	  	 	console.log ('registration succcessfull',user);
   	   	  	 	//registration successfull navigate to login page
   	   	  	 	this.router.navigate(['/signin']); 
   	   	  }, //callback to cath errors thrown bby the Observable in the service
   	   	  error: error => {
   	   	  	this.errorMessage = <any>error;
   	   	  }
        });
  }

  clearForm() {
  	//clears what is appering in the form
  	this.userForm.reset(); 

  }

}
