import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import User from '../models/user';
import config from '../config/config';
import socketService from '../services/socket.service';

/**
 * Handle user authentication
 * Verifies credentials and issues JWT token
 */
export const authenticate = async (req: Request, res: Response): Promise<void> => {
  console.log('Authenticate -> Received Authentication POST');
  
  try {
    const { username, password, latitude, longitude } = req.body;
    
    // Find user by username
    const user = await User.findOne({ username });
    
    // Check if user exists and password matches
    if (!user || user.password !== password) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }
    
    // Update user's logged in status and location coordinates
    user.islogged = true;
    
    // Update coordinates if provided
    if (latitude !== undefined && longitude !== undefined) {
      user.latitude = latitude;
      user.longitude = longitude;
      console.log(`Geolocation obtained: ${longitude} ${latitude}`);
    } else {
      // Use fixed values from the console log as fallback
      user.latitude = 0.0;
      user.longitude = 0.0;
      console.log(`Using default geolocation: ${user.longitude} ${user.latitude}`);
    }
    
    await user.save();
    
    // Broadcast the user login notification
    socketService.newLoggedUserBroadcast(user);
    
    // Generate JWT token with user data
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      config.jwtSecret
    );
    
    // Send successful response with token
    res.status(200).json({
      username: user.username,
      token
    });
    
    console.log(`Authenticate -> User ${username} successfully authenticated`);
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Server error during authentication' });
  }
};

/**
 * Handle user registration
 * Creates a new user if username is not already taken
 */
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  console.log("NewUser -> received form submission new user");
  
  try {
    const { name, email, username, password } = req.body;
    
    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      res.status(409).json({ message: 'Username already exists' });
      return;
    }
    
    // Create new user with data from request
    const newUser = new User({
      name,
      email,
      username,
      password,
      islogged: false,
      latitude: 0,
      longitude: 0
    });
    
    // Save user to database
    const savedUser = await newUser.save();
    
    // Return success response with created user
    res.status(201).json(savedUser);
    
    console.log(`User ${username} successfully registered`);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'Server error during registration'
    });
  }
};

/**
 * Get all users
 * Returns all users from the database
 */
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("GetUsers -> Received request for all users");
    
    // Get all users from the database
    const users = await User.find({});
    
    // Send response
    res.status(200).json(users);
    console.log(`GetUsers -> Responded with ${users.length} users from database`);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      message: 'Server error while fetching users'
    });
  }
};

/**
 * Handle user logout
 * Updates the user's logged in status and broadcasts the logout event
 */
export const logoutUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.body;
    
    if (!username) {
      res.status(400).json({ message: 'Username is required' });
      return;
    }
    
    // Find user by username
    const user = await User.findOne({ username });
    
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    // Update user's logged in status
    user.islogged = false;
    await user.save();
    
    // Broadcast the user logout notification
    socketService.userLoggedOutBroadcast(username);
    
    // Send successful response
    res.status(200).json({ message: 'Successfully logged out' });
    
    console.log(`User ${username} successfully logged out`);
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error during logout' });
  }
};