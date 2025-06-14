export class Item {
	constructor (
      public description: string,
      public currentbid: number,
      public remainingtime: number,
      public buynow: number,
      public wininguser: string,
      public owner: string,
      public sold: boolean = false,
      public id: number = 0
	){}
}
