export class User {
	constructor (
      public name: string,
      public email: string,
      public username: string,
      public password: string,
      public islogged: boolean,
      public latitude: number,
      public longitude: number
	){}
}
