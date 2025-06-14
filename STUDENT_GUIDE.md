# Student Guide to the SAR Auction Project

## Introduction

This guide provides an overview of the MEAN (MongoDB, Express, Angular, Node.js) stack auction application you'll be working with in this course. The project has been structured according to modern best practices to give you a solid foundation for your own development work.

## Project Structure

The application is divided into two main parts:

1. **Frontend**: Angular application (in the `Frontend/` directory)
2. **Backend**: Node.js and Express application (in the `Backend/` directory)

### Frontend Structure (Angular)

The Angular frontend follows a modular architecture organized by feature:

```
Frontend/
├── app/
│   ├── core/              # Core functionality used throughout the app
│   │   ├── guards/        # Route guards for authentication
│   │   ├── models/        # Data models/interfaces
│   │   └── services/      # Singleton services
│   ├── features/          # Feature modules organized by domain
│   │   ├── auction/       # Auction feature module
│   │   ├── auth/          # Authentication feature module
│   │   └── items/         # Items feature module
│   ├── material/          # Material design module
│   ├── shared/            # Shared components, directives, pipes
│   ├── app.component.ts   # Root component
│   └── app.module.ts      # Root module
├── assets/                # Static files
└── environments/          # Environment configuration
```

#### Key Components of the Frontend

- **Core Module**: Contains singleton services and models that are loaded once and used throughout the application
  - **Guards**: Authentication guards for route protection
  - **Models**: TypeScript interfaces representing data structures
  - **Services**: Services for API communication and business logic

- **Feature Modules**: Modules organized by feature/domain
  - **Auth Module**: Components for user authentication (signin/register)
  - **Auction Module**: Components for the auction functionality
  - **Items Module**: Components for item management

- **Shared Module**: Reusable components, directives, and pipes that can be imported by feature modules

### Backend Structure (Express.js & Node.js)

The backend follows a modular structure separated by concern:

```
Backend/
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # Request handlers
│   ├── middlewares/      # Express middlewares
│   ├── models/           # Mongoose models
│   ├── routes/           # Express routes
│   ├── services/         # Business logic
│   └── server.ts         # Entry point
├── cert.pem              # SSL certificate
├── key.pem               # SSL key
├── package.json          # Dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

#### Key Components of the Backend

- **Config**: Configuration for database connections and environment variables
- **Controllers**: Handle the request/response logic
- **Middlewares**: Express middlewares for authentication and error handling
- **Models**: Mongoose schemas and models for MongoDB
- **Routes**: API route definitions
- **Services**: Business logic services, including websocket handling

## Key Technologies

- **MongoDB**: NoSQL database for data storage
- **Express.js**: Web framework for creating the API
- **Angular**: Frontend framework
- **Node.js**: JavaScript runtime for the server
- **TypeScript**: Typed JavaScript for better development experience
- **Socket.io**: Real-time communication between client and server
- **Angular Material**: UI component library
- **JWT**: JSON Web Tokens for authentication

## Application Features

The application is an auction site with the following features:

1. **User Authentication**: Registration and login
2. **Item Listing**: View available items for auction
3. **Bidding System**: Place bids on items
4. **Real-time Updates**: Live updates of bids and auction status via websockets
5. **Item Management**: Add new items to the auction
6. **User Geolocation**: Track and display user locations on a map
7. **Chat Functionality**: Send messages between users

## Getting Started

### Prerequisites

- Node.js (v14+)
- MongoDB 
- Git

### Setting Up the Development Environment

1. Clone the repository
2. Install backend dependencies:
   ```
   cd Backend
   npm install
   ```
3. Install frontend dependencies:
   ```
   cd ..
   npm install
   ```
4. Start MongoDB
5. Start the backend server:
   ```
   cd Backend
   npm start
   ```
6. Start the development server:
   ```
   cd Backend
   npm run dev
   ```
7. Navigate to `https://localhost:3043` or `http://localhost:3000` in your browser

## Development Guidelines

### Angular Development

1. **Component Structure**: When creating new components, place them in the appropriate feature module.

   ```typescript
   // Example of an Angular component in features/auction
   @Component({
     selector: 'app-auction',
     templateUrl: './auction.component.html',
     styleUrls: ['./auction.component.css']
   })
   export class AuctionComponent implements OnInit {
     auctions: Auction[] = [];
     selectedAuction: Auction | null = null;
     
     constructor(private auctionService: AuctionService) { }
     
     ngOnInit(): void {
       this.loadAuctions();
     }
     
     // Component methods
   }
   ```

2. **Services**: Services that are used across multiple feature modules should be placed in the core/services directory.

   ```typescript
   // Example of a core service from core/services/auction.service.ts
   @Injectable({
     providedIn: 'root'
   })
   export class AuctionService {
     private apiUrl = 'api/items';
     
     constructor(private http: HttpClient) { }
     
     getItems(): Observable<Item[]> {
       return this.http.get<Item[]>(this.apiUrl);
     }
     
     // Additional service methods
   }
   ```

3. **Models**: Data models should be defined in the core/models directory.

   ```typescript
   // Example from core/models/user.ts
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
   ```

4. **State Management**: The application uses services for simple state management. For complex state, consider implementing NgRx.

   ```typescript
   // Simple state management in a service
   @Injectable({
     providedIn: 'root'
   })
   export class StateService {
     private itemsSubject = new BehaviorSubject<Item[]>([]);
     public items$ = this.itemsSubject.asObservable();
     
     updateItems(items: Item[]): void {
       this.itemsSubject.next(items);
     }
   }
   ```

5. **Routing**: Add new routes in the appropriate feature module's routing file.

   ```typescript
   // Example feature routing module
   const routes: Routes = [
     { 
       path: 'items', 
       component: ItemsComponent,
       canActivate: [AuthGuard]
     },
     { 
       path: 'items/:id', 
       component: ItemDetailComponent 
     }
   ];
   
   @NgModule({
     imports: [RouterModule.forChild(routes)],
     exports: [RouterModule]
   })
   export class ItemsRoutingModule { }
   ```

### Backend Development

1. **API Endpoints**: Add new endpoints in the appropriate route file in the `Backend/src/routes` directory.

   ```typescript
   // Example from Backend/src/routes/api.routes.ts
   import express from 'express';
   import { AuctionController } from '../controllers/auction.controller';
   import { authMiddleware } from '../middlewares/auth.middleware';

   const router = express.Router();
   const auctionController = new AuctionController();

   router.get('/items', authMiddleware, auctionController.getAllItems);
   router.post('/newitem', authMiddleware, auctionController.createItem);

   export default router;
   ```

2. **Controllers**: Implement controller logic in the `Backend/src/controllers` directory.

   ```typescript
   // Example controller method
   export class ItemController {
     async getAllItems(req: Request, res: Response): Promise<void> {
       try {
         const items = await Item.find();
         res.status(200).json(items);
       } catch (error) {
         res.status(500).json({ message: 'Error fetching items', error });
       }
     }
   }
   ```

3. **Models**: Define MongoDB schemas in the `Backend/src/models` directory.

   ```typescript
   // Example from Backend/src/models/item.ts
   import mongoose, { Schema, Document } from 'mongoose';

   // Item interface defining the document structure
   export interface IItem extends Document {
     description: string;
     currentbid: number;
     remainingtime: number;
     buynow: number;
     wininguser: string;
     sold: boolean;
     owner: string;
     id: number;
   }

   // Item schema definition
   const ItemSchema = new Schema({
     description: String,
     currentbid: Number,
     remainingtime: Number,
     buynow: Number,
     wininguser: String,
     sold: Boolean,
     owner: String,
     id: Number
   });

   // Add index for better query performance
   ItemSchema.index({ sold: 1, remainingtime: 1 });

   // Export the model
   export default mongoose.model<IItem>('Item', ItemSchema);
   ```

4. **Middleware**: Add custom middleware in the `Backend/src/middlewares` directory.

   ```typescript
   // Example authentication middleware
   import { Request, Response, NextFunction } from 'express';
   import jwt from 'jsonwebtoken';
   import config from '../config/config';

   export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
     try {
       const token = req.headers.authorization?.split(' ')[1];
       
       if (!token) {
         res.status(401).json({ message: 'Authentication required' });
         return;
       }
       
       const decoded = jwt.verify(token, config.jwtSecret);
       req.user = decoded;
       next();
     } catch (error) {
       res.status(401).json({ message: 'Invalid or expired token' });
     }
   };
   ```

5. **Authentication**: The application uses JWT for authentication. Protected routes require a valid JWT token.

   ```typescript
   // Example JWT generation
   const token = jwt.sign(
     { userId: user._id, username: user.username },
     config.jwtSecret,
     { expiresIn: '24h' }
   );
   ```

### Working with MongoDB

1. **Connecting to the Database**:

   ```typescript
   // Example from Backend/src/config/db.ts
   import mongoose from 'mongoose';
   import config from './config';

   export const connectDatabase = async (): Promise<void> => {
     try {
       mongoose.set('strictQuery', false);
       
       await mongoose.connect(config.mongoUri);
       
       console.log(`MongoDB connected: ${config.mongoUri}`);
       
       mongoose.connection.on('error', err => {
         console.error(`MongoDB connection error: ${err}`);
       });
       
       // Clean up connection on app termination
       process.on('SIGINT', async () => {
         await mongoose.connection.close();
         console.log('MongoDB connection closed due to app termination');
         process.exit(0);
       });
       
     } catch (err) {
       console.error('MongoDB connection error:', err);
       process.exit(1);
     }
   };
   ```

2. **Performing CRUD Operations**:

   ```typescript
   // Create a new document
   const createItem = async (itemData) => {
     const newItem = new Item(itemData);
     return await newItem.save();
   };

   // Read documents
   const getItems = async (filter = {}) => {
     return await Item.find(filter);
   };

   // Update a document
   const updateItem = async (id, updateData) => {
     return await Item.findByIdAndUpdate(id, updateData, { new: true });
   };

   // Delete a document
   const deleteItem = async (id) => {
     return await Item.findByIdAndDelete(id);
   };
   ```

3. **Using Mongoose Queries**:

   ```typescript
   // Examples of various query methods
   
   // Find with conditions
   const activeItems = await Item.find({ sold: false, remainingtime: { $gt: 0 } });
   
   // Sorting
   const expensiveItems = await Item.find().sort({ currentbid: -1 });
   
   // Limiting results
   const recentItems = await Item.find().sort({ _id: -1 }).limit(10);
   
   // Pagination
   const pageSize = 20;
   const pageNumber = 2;
   const paginatedItems = await Item.find()
     .skip((pageNumber - 1) * pageSize)
     .limit(pageSize);
     
   // Selecting specific fields
   const itemSummaries = await Item.find().select('description currentbid');
   
   // Population (joining)
   const itemsWithOwners = await Item.find().populate('owner', 'username email');
   ```

### Best Practices

1. **Use TypeScript**: Write type-safe code with interfaces and proper typing.

   ```typescript
   // Type-safe function example
   function calculateRemainingTime(endTime: Date): number {
     const currentTime = new Date();
     return Math.max(0, endTime.getTime() - currentTime.getTime());
   }
   ```

2. **Follow Angular Style Guide**: Adhere to the [Angular Style Guide](https://angular.io/guide/styleguide).

## Project Structure Best Practices

This project follows several best practices for MEAN stack development:

### Angular Best Practices

- **Modular architecture**: Code is organized into feature modules
- **Core module**: Contains singleton services and guards
- **Shared module**: Contains reusable components, directives, and pipes
- **Barrel exports**: Index files are used for cleaner imports
- **Component isolation**: Components are organized by feature with their own templates and styles

### Express.js Best Practices

- **Route organization**: Routes are structured by feature
- **Middleware**: Uses middleware for authentication and error handling
- **Controllers**: Route handlers are separated into controller functions
- **Error middleware**: Centralized error handling

### MongoDB Best Practices

- **Schema design**: Schemas are designed according to application access patterns
- **Validation**: Implements schema validation
- **Relationships**: Uses references or embedding based on data relationships

## Common Tasks

### Adding a New Component

1. Create the component in the appropriate feature module:
   ```
   ng generate component features/[feature-name]/components/[component-name]
   ```

2. Add the component to the feature module's declarations.

3. If the component needs to be visible outside its module, add it to the module's exports.

### Adding a New Service

1. Create the service in the core/services directory:
   ```
   ng generate service core/services/[service-name]
   ```

2. Add the service to the core module's providers.

3. Import the service where needed.

### Adding a New API Endpoint

1. Create a route handler in the appropriate controller file in `Backend/src/controllers`.

2. Add the route to the appropriate route file in `Backend/src/routes`.

3. If needed, create a new model in `Backend/src/models`.

## Troubleshooting

### Common Issues

1. **JWT Token Expired**: Log out and log in again to refresh your token.

2. **WebSocket Connection Failed**: Ensure the backend server is running and check for any CORS issues.

3. **MongoDB Connection Issues**: Verify that MongoDB is running and the connection string is correct.

4. **TypeScript Compilation Errors**: Check for type errors and missing imports.

## Conclusion

This guide should help you understand the structure and organization of the MEAN stack auction application. Follow the development guidelines and best practices to ensure your code is maintainable, scalable, and follows industry standards.

For more detailed information about specific technologies, refer to their official documentation:

- [Angular Documentation](https://angular.io/docs)
- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Node.js Documentation](https://nodejs.org/en/docs/)
- [Socket.io Documentation](https://socket.io/docs/)