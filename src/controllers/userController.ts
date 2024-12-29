import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User, {IUser} from "../models/userModel";

import { 
  sendVerificationEmailService,
  getAllUserService,
  getUserByJWTTokenService,
  getUserByIdService
} from '../services/userServices';
import { generateEncryptedIdService, verifyTokenService } from '../services/authServices';
import {encodeId} from '../utils/encodeDecodeUtil';
import dotenv from 'dotenv';

dotenv.config();


//Create new user 
export const createUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const {name, username, email, password} = req.body;
        const user = new User ({
            name,
            username,
            email,
            password,
            created_at: new Date(),
            updated_at: new Date(),
        });
        const savedUser = await user.save();
        const token = jwt.sign(
          { userId: savedUser._id, email: savedUser.email },
          process.env.JWT_SECRET_KEY as string,
          { expiresIn: '1h' }
        )

        const JWTEncodedUserId = generateEncryptedIdService(savedUser._id.toString());
        const encodedUserId = encodeId(JWTEncodedUserId);
        console.log('Generated token:', token);

        const verificationUrl = `${process.env.BACKEND_URL}/api/users/verify-email?token=${encodeURIComponent(token)}&redirect=${encodeURIComponent(`${process.env.FRONTEND_URL}/dashboard?id=${encodedUserId}`)}`;
        
        // Send verification email in the background
        sendVerificationEmailService(user.email, verificationUrl).catch(err => {
          console.error('Error sending verification email:', err);
        });
        
        res.status(201).json({ message: 'User created', user: savedUser, token});


    } catch(error) {
        res.status(500).json({ message: 'Error creating user', error });
    }
}

//Get all users
export const getAllUsers = async (req:Request, res: Response): Promise<void> => {
    try {
      const users = await getAllUserService(); 
      console.log('Retrieved users:', users.length);
      res.status(200).json(users); 
    } catch (error) {
      console.error('Error getting users:', error); 
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Error retrieving users',
      });
    }
}

// Get a single user by JWTTOKEN from URL
export const getUserByJWTToken = async (req: Request, res: Response): Promise<void> => {
  try {

    const JWTToken = req.params.id;
    const user = await getUserByJWTTokenService(JWTToken);
    res.status(200).json(user);

  } catch(error) {
    if (error instanceof Error) {
      res.status(500).json({
        message: error.message || 'An unknown error occurred',
      });
    } else if (typeof error === 'object' && error !== null && 'status' in error) {
      const customError = error as { status: number; message: string };
      res.status(customError.status).json({
        message: customError.message,
      });
    } else {
      res.status(500).json({
        message: 'An unknown error occurred',
      });
    } 
  }
}

// Get a single user by ID
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id; 
    const user = await getUserByIdService(userId); 
    res.status(200).json(user); 
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else if (typeof error === 'object' && error !== null && 'status' in error) {
      const customError = error as { status: number; message: string };
      res.status(customError.status).json({ message: customError.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};



  // Update a user
  export const updateUser = async (req: Request, res: Response): Promise<string | any> => {
    try {
      const { name, username, email, password } = req.body;
  
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' }); // Add 'return'
      }
  
      user.name = name || user.name;
      user.username = username || user.username;
      user.email = email || user.email;
  
      if (password) {
        const saltRounds = 10;
        user.password = await bcrypt.hash(password, saltRounds);
      }
  
      user.updated_at = new Date();
  
      const updatedUser = await user.save();
      return res.status(200).json({ message: 'User updated', user: updatedUser }); // Add 'return'
    } catch (error) {
      res.status(500).json({ message: 'Error updating user', error });
    }
  };
  
  
  // Delete a user
  export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await User.findByIdAndDelete(req.params.id);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
      } else {
        res.status(200).json({ message: 'User deleted' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error deleting user', error });
    }
  };

  //Check user exists
  export const checkUserExists = async (req: Request, res: Response): Promise<Response> => {
    const { username, email } = req.query; // Get from query parameters

    try {
        // Check if a user with the same username or email exists
        const user = await User.findOne({
            $or: [
                { username: username },
                { email: email }
            ]
        });

        if (user) {
            return res.status(200).json({ exists: true });
        }

        return res.status(200).json({ exists: false });
    } catch (error) {
        return res.status(500).json({ message: 'Error checking user', error });
    }
};


//Verify user email and account
export const verifyUserEmail = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { token, redirect } = req.query;

    if (!token) {
      return res.status(400).json({ message: 'Token is required' }); // Add 'return'
    }

    const decoded = jwt.verify(token as string, process.env.JWT_SECRET_KEY as string);
    if (!decoded || typeof decoded === 'string') {
      return res.status(400).json({ message: 'Invalid token' }); // Add 'return'
    }

    const { userId } = decoded as { userId: string; email: string };

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' }); // Add 'return'
    }

    user.verified = true;
    user.updated_at = new Date();
    user.status = "online";
    await user.save();

    const redirectUrl = redirect ? decodeURIComponent(redirect as string) : `${process.env.FRONTEND_URL}/login`;
    return res.redirect(302, redirectUrl); // Add 'return'
  } catch (error) {
    console.error('Error verifying email:', error);
    return res.status(500).json({ message: 'Error verifying email', error }); // Add 'return'
  }
};



// Search for users based on partial username or email
export const searchUsers = async (req: Request, res: Response): Promise<Response> => {
  const {query} = req.query;

  if(!query || typeof query !== 'string') {
    return res.status(400).json({message: 'Query parameter is required and must be a string.'})
  }

  try {
    const users = await User.find({
      $or: [
        {username: {$regex : new RegExp('^' + query, 'i')}},
        {email: {$regex: new RegExp('^' + query, 'i')}},
      ]
    }).select('username email');

    return res.status(200).json({ users });
  } catch(error) {
    return res.status(500).json({ message: 'Error searching users', error })
  }
}
