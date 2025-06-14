/**
 * Express app to serve Angular single page auction site
 * Modernized with TypeScript and best practices
 */
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

// Enable CORS
app.use(cors());

// Logging middleware
app.use(morgan('dev'));

// Parse request bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Parse cookies
app.use(cookieParser());

// API routes
app.use('/api', apiRoutes);

// Check if Angular build files exist
const angularDistPath = path.join(__dirname, '../../dist/auction-sar');
if (fs.existsSync(angularDistPath)) {
  // If Angular build exists, serve static files
  app.use(express.static(angularDistPath));
  
  if (fs.existsSync(path.join(angularDistPath, 'favicon.ico'))) {
    app.use(favicon(path.join(angularDistPath, 'favicon.ico')));
  }
  
  // Serve Angular app for all other routes
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(angularDistPath, 'index.html'));
  });
} else {
  // If Angular build doesn't exist, just respond with API status
  app.get('/', (req: Request, res: Response) => {
    res.json({ 
      status: 'API is running', 
      message: 'Angular frontend not built. Access API endpoints directly at /api/*' 
    });
  });
}

// Error handling middleware
app.use(errorHandler);

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
    origin: [
      `https://localhost:${config.httpsPort}`,
      `http://localhost:${config.httpsPort}`,
      `http://localhost:${config.port}`,
      // Add any additional domains needed for production
    ],
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000, // Increase ping timeout to handle slow connections
  transports: ['websocket', 'polling'] // Prefer WebSocket but fallback to polling if needed
});

// Initialize socket service
socketService.init(io);

// Connect to database and start servers
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();
    
    // Start the HTTP server for redirection
    httpServer.listen(config.port, () => {
      console.log(`HTTP server for HTTPS redirection running on http://localhost:${config.port}`);
    });
    
    // Start the HTTPS server
    httpsServer.listen(config.httpsPort, () => {
      console.log(`API running on https://localhost:${config.httpsPort}`);
    });
    
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err);
  process.exit(1);
});

// Start the server
startServer();