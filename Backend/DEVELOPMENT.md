# Development Workflow

This document outlines the recommended workflow for developing the auction application backend.

## Getting Started

1. Set up the environment:
   ```
   ./setup.sh
   ```

2. Start the development server:
   ```
   npm run dev
   ```

## Project Structure

- **src/config/** - Configuration files including database and environment settings
- **src/controllers/** - Request handlers that process HTTP requests
- **src/middlewares/** - Express middleware functions
- **src/models/** - Mongoose models for MongoDB
- **src/routes/** - Express routes that define API endpoints
- **src/services/** - Business logic and services
- **src/utils/** - Utility functions and helpers

## Development Tasks

### Adding a New API Endpoint

1. Create controller function in the appropriate controller file
2. Add route in the api.routes.ts file
3. Test the endpoint with a REST client (like Postman)

### Adding Database Features

1. Update the model in the models/ directory
2. Use mongoose methods in the controller or service

   **Examples:**
   
   ```typescript
   // Example 1: Creating a new document in a controller
   export const createItem = async (req: Request, res: Response): Promise<void> => {
     try {
       const newItem = new Item({
         name: req.body.name,
         description: req.body.description,
         startingPrice: req.body.startingPrice,
         seller: req.user._id // From auth middleware
       });
       
       const savedItem = await newItem.save();
       res.status(201).json(savedItem);
     } catch (error) {
       res.status(500).json({ message: 'Error creating item', error });
     }
   };
   
   // Example 2: Finding and updating documents in a service
   export const updateBidService = async (itemId: string, userId: string, bidAmount: number): Promise<any> => {
     // Find and update in one operation using findOneAndUpdate
     const updatedItem = await Item.findOneAndUpdate(
       { _id: itemId, currentBid: { $lt: bidAmount } }, // Query conditions
       { 
         currentBid: bidAmount,
         currentBidder: userId,
         $push: { bidHistory: { user: userId, amount: bidAmount, time: new Date() } }
       },
       { new: true, runValidators: true } // Options to return updated doc and run validators
     );
     
     return updatedItem;
   };
   
   // Example 3: Performing aggregations for reports
   export const getPopularItemsService = async (limit: number = 10): Promise<any[]> => {
     return Item.aggregate([
       { $match: { status: 'active' } },
       { $addFields: { bidCount: { $size: "$bidHistory" } } },
       { $sort: { bidCount: -1 } },
       { $limit: limit },
       {
         $lookup: {
           from: 'users',
           localField: 'seller',
           foreignField: '_id',
           as: 'sellerInfo'
         }
       },
       { $project: { 'sellerInfo.password': 0 } } // Exclude sensitive data
     ]);
   };
   ```

### Authentication

- JWT tokens are used for authentication
- Protected routes use the authentication middleware
- Socket.IO connections also use JWT for authentication

## MongoDB Connection

The database connection is managed in `src/config/db.ts`. The connection string is defined in the `.env` file.

## Environment Variables

Configuration is managed via environment variables in the `.env` file:

- PORT - HTTP port
- HTTPS_PORT - HTTPS port
- MONGODB_URI - MongoDB connection string
- JWT_SECRET - Secret for signing JWT tokens
- NODE_ENV - Environment (development, production)

## Tips for Students

1. Use TypeScript types to ensure code quality and get better IDE support
2. Follow the existing patterns when adding new features
3. Use console.log for basic debugging but consider more structured logging for real projects
4. Remember to validate user inputs on the server side
5. Always handle errors and provide appropriate error responses
6. Keep controllers thin and move business logic to services