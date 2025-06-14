import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import * as itemController from '../controllers/item.controller';
import { authenticate, addUserToRequest, handleJwtError } from '../middlewares/auth.middleware';

const router = Router();

// Auth routes
router.post('/authenticate', authController.authenticate);
router.post('/newuser', authController.registerUser);
router.get('/users', authenticate, addUserToRequest, authController.getUsers);
router.post('/logout', authenticate, addUserToRequest, authController.logoutUser);

// Item routes
router.post('/newitem', authenticate, addUserToRequest, itemController.createItem);
router.post('/removeitem', authenticate, addUserToRequest, itemController.removeItem);
router.get('/items', authenticate, addUserToRequest, itemController.getItems);

// Handle JWT errors
router.use(handleJwtError);

export default router;