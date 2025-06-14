# Auction Application Backend

This is the backend for a MEAN stack auction application. It has been modernized following industry best practices while maintaining the core functionality for educational purposes.

## Project Structure

```
Backend/
├── src/                # TypeScript source files
│   ├── config/         # Configuration files
│   ├── controllers/    # Request handlers
│   ├── middlewares/    # Express middlewares
│   ├── models/         # Mongoose data models
│   ├── routes/         # API routes
│   ├── services/       # Business logic services
│   └── utils/          # Utility functions
├── dist/               # Compiled JavaScript output
├── logs/               # Application logs
├── .env                # Environment variables
└── server.js           # Entry point
```

## Getting Started

1. Make sure you have Node.js (14+) and MongoDB installed

2. Set up the project:
   ```
   ./setup.sh
   ```
   
   This will install dependencies and build the TypeScript files.

3. Start the development server:
   ```
   npm run dev
   ```

4. For production:
   ```
   npm start
   ```

## API Endpoints

- `POST /api/authenticate`: User login
- `POST /api/newuser`: User registration
- `GET /api/users`: Get all logged-in users (requires auth)
- `POST /api/newitem`: Create a new auction item (requires auth)
- `POST /api/removeitem`: Remove an auction item (requires auth)
- `GET /api/items`: Get all auction items (requires auth)

## Technologies Used

- **TypeScript**: For type safety and better developer experience
- **Express**: Web framework for Node.js
- **MongoDB/Mongoose**: Database and ODM
- **Socket.IO**: Real-time bidding functionality
- **JWT**: Authentication and authorization
- **HTTPS**: Secure communication


## Development Notes

- The `.env` file contains configuration settings
- JWT secret is used for both API and Socket.IO authentication
- API routes are protected with JWT authentication middleware
- Socket.IO uses the same JWT token for authentication

## License

This software is provided for educational purposes. See the LICENSE file for details.