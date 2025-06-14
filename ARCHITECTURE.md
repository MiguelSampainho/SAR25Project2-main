# SAR Auction Project Architecture

## 1. System Overview

The SAR Auction Project is a real-time auction application built on the MEAN stack (MongoDB, Express.js, Angular, Node.js). It follows a client-server architecture with a clear separation of concerns between the frontend and backend.

## 2. Architecture Principles

The application architecture follows these key principles:

- **Modularity**: Code is organized into modules by feature/domain
- **Separation of Concerns**: Clear separation of data access, business logic, and presentation
- **TypeScript**: Used throughout for type safety and improved developer experience
- **RESTful API**: Backend exposes a RESTful API for client-server communication
- **Real-time Communication**: Socket.IO for bidding and user presence updates

## 3. Frontend Architecture

The Angular frontend follows a modular architecture organized by feature and adheres to Angular best practices.

### 3.1 Directory Structure

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

### 3.2 Core Module

The Core module contains singleton services, guards, and models that are used throughout the application. It's imported only once in the AppModule.

```typescript
// Frontend/app/core/core.module.ts
import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule
  ],
  providers: [
    // Global services go here
  ],
  declarations: []
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule is already loaded. Import it only in AppModule.');
    }
  }
}
```

### 3.3 Feature Modules

Feature modules encapsulate related functionality. Each feature module contains its components, services, and routing.

Here's an example of the Auction feature module:

```typescript
// Frontend/app/features/auction/auction.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuctionComponent } from './components/auction/auction.component';
import { MaterialModule } from '../../material/material.module';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    MaterialModule,
    SharedModule
  ],
  declarations: [
    AuctionComponent
  ],
  exports: [
    AuctionComponent
  ]
})
export class AuctionModule { }
```

### 3.4 Component Architecture

The application follows the smart/presentational component pattern:

- **Smart Components**: Handle data access and business logic
- **Presentational Components**: Focus on UI presentation

Example of a smart component:

```typescript
// Frontend/app/features/auction/components/auction/auction.component.ts
@Component({
  selector: 'app-auction',
  templateUrl: './auction.component.html',
  styleUrls: ['./auction.component.css']
})
export class AuctionComponent implements OnInit {
  auctions: Item[] = [];
  
  constructor(private auctionService: AuctionService) { }
  
  ngOnInit(): void {
    this.loadAuctions();
    this.setupRealTimeUpdates();
  }
  
  loadAuctions(): void {
    this.auctionService.getItems()
      .subscribe(items => this.auctions = items);
  }
  
  setupRealTimeUpdates(): void {
    // Socket.IO subscription setup
  }
}
```

### 3.5 Services

Services handle data fetching, state management, and business logic. They communicate with the backend APIs.

```typescript
// Frontend/app/core/services/auction.service.ts
@Injectable({
  providedIn: 'root'
})
export class AuctionService {
  private apiUrl = 'api/items';
  
  constructor(private http: HttpClient) { }
  
  getItems(): Observable<Item[]> {
    return this.http.get<Item[]>(this.apiUrl);
  }
  
  getItem(id: number): Observable<Item> {
    return this.http.get<Item>(`${this.apiUrl}/${id}`);
  }
  
  createItem(item: Item): Observable<Item> {
    return this.http.post<Item>('api/newitem', item);
  }
  
  placeBid(itemId: number, bidAmount: number): Observable<Item> {
    return this.http.post<Item>('api/placebid', { itemId, bidAmount });
  }
}
```

### 3.6 Models

Models define the data structures used in the application. They are TypeScript interfaces or classes that represent the shapes of data.

```typescript
// Frontend/app/core/models/user.ts
export class User {
  constructor(
    public name: string,
    public email: string,
    public username: string,
    public password: string,
    public islogged: boolean,
    public latitude: number,
    public longitude: number
  ) {}
}

// Frontend/app/core/models/item.ts
export interface Item {
  _id?: string;
  description: string;
  currentbid: number;
  remainingtime: number;
  buynow: number;
  wininguser: string;
  sold: boolean;
  owner: string;
  id: number;
}
```

### 3.7 Authentication

Authentication is handled with JWT tokens stored in localStorage.

```typescript
// Frontend/app/core/services/signin.service.ts
@Injectable({
  providedIn: 'root'
})
export class SigninService {
  private tokenKey = 'auth_token';
  
  constructor(private http: HttpClient) { }
  
  login(credentials: {username: string, password: string}): Observable<any> {
    return this.http.post<any>('api/authenticate', credentials)
      .pipe(
        tap(response => {
          if (response && response.token) {
            localStorage.setItem(this.tokenKey, response.token);
          }
        })
      );
  }
  
  logout(): void {
    localStorage.removeItem(this.tokenKey);
  }
  
  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }
  
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }
}
```

### 3.8 Route Guards

Route guards protect routes from unauthorized access.

```typescript
// Frontend/app/core/guards/auth.guard.ts
@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private signinService: SigninService, private router: Router) {}
  
  canActivate(): boolean {
    if (this.signinService.isLoggedIn()) {
      return true;
    }
    
    this.router.navigate(['/signin']);
    return false;
  }
}
```

## 4. Backend Architecture

The backend uses Express.js with TypeScript, following a layered architecture with clear separation of concerns.

### 4.1 Directory Structure

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

### 4.2 Server Setup

The main server file sets up Express, connects to MongoDB, and initializes Socket.IO.

```typescript
// Backend/src/server.ts
import express from 'express';
import fs from 'fs';
import path from 'path';
import favicon from 'serve-favicon';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import http from 'http';
import https from 'https';
import { Server } from 'socket.io';
import bodyParser from 'body-parser';
import { Request, Response } from 'express';

// Import custom modules
import config from './config/config';
import { connectDatabase } from './config/db';
import apiRoutes from './routes/api.routes';
import socketService from './services/socket.service';
import errorHandler from './middlewares/errorHandler';

// Initialize express app
const app = express();

// Apply security headers
app.use(helmet({
  contentSecurityPolicy: false // Disabled for development
}));

// Setup HTTP server for HTTPS redirection
const httpApp = express();
httpApp.set('port', config.port);

// Redirect all HTTP requests to HTTPS
httpApp.get('*', (req: Request, res: Response) => {
  const host = req.headers.host?.split(':')[0];
  res.redirect(`https://${host}:${config.httpsPort}${req.url}`);
});

const httpServer = http.createServer(httpApp);

// Setup HTTPS server with SSL
const httpsOptions = {
  key: fs.readFileSync(config.sslKeyPath),
  cert: fs.readFileSync(config.sslCertPath)
};

const httpsServer = https.createServer(httpsOptions, app);

// Setup Socket.IO
const io = new Server(httpsServer, {
  cors: {
    origin: `http://localhost:${config.httpsPort}`,
    methods: ['GET', 'POST']
  }
});

// Initialize socket service
socketService.init(io);

// Connect to database and start servers
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();
    
    // Start the HTTP server for redirection
    httpServer.listen(config.port);
    
    // Start the HTTPS server
    httpsServer.listen(config.httpsPort);
    
    console.log(`HTTP server running on port ${config.port}`);
    console.log(`HTTPS server running on port ${config.httpsPort}`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
```

### 4.3 Configuration

Configuration is managed using environment variables with sensible defaults.

```typescript
// Backend/src/config/config.ts
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface Config {
  port: number;
  httpsPort: number;
  mongoUri: string;
  jwtSecret: string;
  nodeEnv: string;
  clientPath: string;
  sslKeyPath: string;
  sslCertPath: string;
}

const config: Config = {
  port: parseInt(process.env['PORT'] || '3000', 10),
  httpsPort: parseInt(process.env['HTTPS_PORT'] || '3043', 10),
  mongoUri: process.env['MONGODB_URI'] || 'mongodb://127.0.0.1:27017/local',
  jwtSecret: process.env['JWT_SECRET'] || 'this_is_the_secret_secret_secret_12356',
  nodeEnv: process.env['NODE_ENV'] || 'development',
  clientPath: path.resolve(__dirname, '../../../dist/auction-sar'),
  sslKeyPath: path.resolve(__dirname, '../../key.pem'),
  sslCertPath: path.resolve(__dirname, '../../cert.pem')
};

export default config;
```

### 4.4 Database Connection

MongoDB connection is set up with proper error handling and connection events.

```typescript
// Backend/src/config/db.ts
import mongoose from 'mongoose';
import config from './config';

/**
 * Database connection helper
 */
export const connectDatabase = async (): Promise<void> => {
  try {
    mongoose.set('strictQuery', false);
    
    await mongoose.connect(config.mongoUri);
    
    console.log(`MongoDB connected: ${config.mongoUri}`);
    
    mongoose.connection.on('error', err => {
      console.error(`MongoDB connection error: ${err}`);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
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

### 4.5 Models

Mongoose models define the database schemas.

```typescript
// Backend/src/models/item.ts
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

// Backend/src/models/user.ts
import mongoose, { Schema, Document } from 'mongoose';

// User interface defining the document structure
export interface IUser extends Document {
  name: string;
  email: string;
  username: string;
  password: string;
  islogged: boolean;
  latitude: number;
  longitude: number;
}

// User schema definition
const UserSchema = new Schema({
  name: String,
  email: String,
  username: String,
  password: String,
  islogged: Boolean,
  latitude: Number,
  longitude: Number
});

// Export the model
export default mongoose.model<IUser>('User', UserSchema);
```

### 4.6 Routes

API routes define the endpoints and link them to controller methods.

```typescript
// Backend/src/routes/api.routes.ts
import express from 'express';
import { AuthController } from '../controllers/auth.controller';
import { ItemController } from '../controllers/item.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = express.Router();
const authController = new AuthController();
const itemController = new ItemController();

// Authentication routes
router.post('/authenticate', authController.authenticate);
router.post('/newuser', authController.register);

// Item routes
router.get('/items', authMiddleware, itemController.getItems);
router.post('/newitem', authMiddleware, itemController.createItem);
router.post('/removeitem', authMiddleware, itemController.removeItem);

// User routes
router.get('/users', authMiddleware, authController.getUsers);

export default router;
```

### 4.7 Controllers

Controllers handle the HTTP request/response logic and delegate business logic to services.

```typescript
// Backend/src/controllers/item.controller.ts
import { Request, Response } from 'express';
import Item from '../models/item';

export class ItemController {
  async getItems(req: Request, res: Response): Promise<void> {
    try {
      const items = await Item.find();
      res.status(200).json(items);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching items', error });
    }
  }
  
  async createItem(req: Request, res: Response): Promise<void> {
    try {
      const { description, currentbid, remainingtime, buynow, owner } = req.body;
      
      // Get the highest current ID
      const highestItem = await Item.findOne().sort('-id');
      const newId = highestItem ? highestItem.id + 1 : 1;
      
      const newItem = new Item({
        description,
        currentbid,
        remainingtime,
        buynow,
        owner,
        id: newId,
        wininguser: '',
        sold: false
      });
      
      const savedItem = await newItem.save();
      res.status(201).json(savedItem);
    } catch (error) {
      res.status(500).json({ message: 'Error creating item', error });
    }
  }
  
  async removeItem(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.body;
      await Item.findOneAndDelete({ id });
      res.status(200).json({ message: 'Item deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting item', error });
    }
  }
}
```

### 4.8 Middlewares

Middlewares handle cross-cutting concerns like authentication.

```typescript
// Backend/src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/config';

interface DecodedToken {
  userId: string;
  username: string;
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: DecodedToken;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    
    const decoded = jwt.verify(token, config.jwtSecret) as DecodedToken;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};
```

### 4.9 Socket.IO Integration

Socket.IO is used for real-time communication between the client and server.

```typescript
// Backend/src/services/socket.service.ts
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import config from '../config/config';
import User from '../models/user';
import Item from '../models/item';

class SocketService {
  private io: Server | null = null;
  
  init(io: Server): void {
    this.io = io;
    
    io.use((socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }
        
        jwt.verify(token, config.jwtSecret);
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });
    
    io.on('connection', (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`);
      
      socket.on('joinAuction', (auctionId: string) => {
        socket.join(`auction:${auctionId}`);
      });
      
      socket.on('placeBid', async (data: { itemId: number, amount: number, username: string }) => {
        try {
          const { itemId, amount, username } = data;
          
          const item = await Item.findOne({ id: itemId });
          if (!item) {
            return socket.emit('bidError', { message: 'Item not found' });
          }
          
          if (item.currentbid >= amount) {
            return socket.emit('bidError', { message: 'Bid amount too low' });
          }
          
          item.currentbid = amount;
          item.wininguser = username;
          await item.save();
          
          this.io!.to(`auction:${itemId}`).emit('bidUpdate', item);
        } catch (error) {
          socket.emit('bidError', { message: 'Error processing bid' });
        }
      });
      
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  }
  
  // Methods to emit events to clients
  emitBidUpdate(itemId: number, item: any): void {
    if (this.io) {
      this.io.to(`auction:${itemId}`).emit('bidUpdate', item);
    }
  }
  
  updateRemainingTime(): void {
    if (!this.io) return;
    
    setInterval(async () => {
      try {
        const items = await Item.find({ sold: false, remainingtime: { $gt: 0 } });
        
        for (const item of items) {
          item.remainingtime -= 1;
          
          // If time runs out, mark as sold
          if (item.remainingtime <= 0) {
            item.sold = true;
          }
          
          await item.save();
          this.io!.emit('itemUpdate', item);
        }
      } catch (error) {
        console.error('Error updating remaining time:', error);
      }
    }, 1000); // Update every second
  }
}

export default new SocketService();
```

## 5. Authentication Flow

The application uses JWT (JSON Web Tokens) for authentication:

1. The client sends credentials to the server
2. The server validates credentials and returns a JWT
3. The client stores the JWT and includes it in subsequent requests
4. Protected routes check the JWT before allowing access

```typescript
// Backend/src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import User from '../models/user';
import config from '../config/config';

export class AuthController {
  async authenticate(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;
      
      const user = await User.findOne({ username });
      
      if (!user || user.password !== password) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }
      
      // Update user login status
      user.islogged = true;
      await user.save();
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id, username: user.username },
        config.jwtSecret,
        { expiresIn: '24h' }
      );
      
      res.status(200).json({
        message: 'Authentication successful',
        token,
        user: {
          name: user.name,
          email: user.email,
          username: user.username
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Authentication failed', error });
    }
  }
  
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, username, password, latitude, longitude } = req.body;
      
      // Check if username already exists
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        res.status(409).json({ message: 'Username already exists' });
        return;
      }
      
      const newUser = new User({
        name,
        email,
        username,
        password,
        islogged: true,
        latitude,
        longitude
      });
      
      const savedUser = await newUser.save();
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: savedUser._id, username: savedUser.username },
        config.jwtSecret,
        { expiresIn: '24h' }
      );
      
      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          name: savedUser.name,
          email: savedUser.email,
          username: savedUser.username
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Registration failed', error });
    }
  }
  
  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await User.find({ islogged: true }).select('-password');
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching users', error });
    }
  }
  
  async logout(req: Request, res: Response): Promise<void> {
    try {
      const { username } = req.body;
      
      await User.findOneAndUpdate(
        { username },
        { islogged: false }
      );
      
      res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
      res.status(500).json({ message: 'Logout failed', error });
    }
  }
}
```

## 6. Real-time Communication

WebSockets (Socket.io) are used for real-time communication:

1. Client establishes a WebSocket connection after authentication
2. Server emits events for:
   - Item updates
   - New bids
   - User presence
3. Clients subscribe to relevant events and update the UI accordingly

## 7. Database Schema

The application uses MongoDB with Mongoose schemas:

### 7.1 User Schema

```typescript
// Backend/src/models/user.ts
const UserSchema = new Schema({
  name: String,
  email: String,
  username: String,
  password: String,
  islogged: Boolean,
  latitude: Number,
  longitude: Number
});
```

### 7.2 Item Schema

```typescript
// Backend/src/models/item.ts
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
```

## 8. Security Considerations

The application implements several security measures:

- **HTTPS**: All communication is done over HTTPS
- **JWT Authentication**: Secure token-based authentication
- **Protected Routes**: API routes are protected by authentication middleware
- **Security Headers**: Helmet.js is used to set security headers
- **Input Validation**: Request validation is performed on inputs

## 9. Performance Optimization

- **Database Indexing**: Indexes are added to MongoDB collections for frequently queried fields
- **Static Asset Caching**: Browser caching for static assets
- **Lazy Loading**: Angular modules are lazy-loaded for better performance
- **Socket.IO Room-Based Events**: Events are emitted only to relevant clients using rooms

## 10. Deployment Architecture

- **Frontend**: Angular application served as static files
- **Backend**: Node.js server with Express
- **Database**: MongoDB database
- **Web Server**: HTTPS server with automatic HTTP to HTTPS redirection
- **WebSockets**: Socket.IO for real-time communication