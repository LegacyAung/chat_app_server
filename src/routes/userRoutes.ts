import { Router } from 'express';
import {
    createUser,
    getAllUsers,
    getUserByJWTToken,
    getUserById,
    updateUser,
    deleteUser,
    checkUserExists,
    verifyUserEmail,
    searchUsers
} from '../controllers/userController'; // Adjust the path as needed

const router = Router();

// Route to get a single user by username and password
router.get('/checkuser', checkUserExists); 

// Route to create a new user
router.post('/', createUser);

// Route to checkuser
router.get('/searchusers', searchUsers);

// Route to verify email
router.get('/verify-email', verifyUserEmail);

// Route to get all users
router.get('/', getAllUsers);

// Route to get a single user by JWT token
router.get('/jwt-token/:id', getUserByJWTToken)

// Route to get a single user by ID
router.get('/:id', getUserById);

// Route to update a user
router.put('/:id', updateUser);

// Route to delete a user
router.delete('/:id', deleteUser);

export default router;
