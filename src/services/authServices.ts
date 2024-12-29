import User from '../models/userModel';
import bcrypt from 'bcrypt';
import jwt, {JwtPayload } from 'jsonwebtoken';
import {Types} from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

interface CustomJwtPayload extends JwtPayload {
    id: string;
}

interface AuthResult {
    user: {
        _id: Types.ObjectId;
        email: string;
        username: string;
        password: string;
        verified: boolean;
        status: 'online' | 'offline' | 'idle';
    };
    token:string;
}

// Service to generateEncryptedId
export const generateEncryptedIdService = (userId:string): string => {
    return jwt.sign({id:userId}, process.env.JWT_SECRET_KEY!, {expiresIn: '1h'});
}

// Service to decodedUserId
export const verifyTokenService = (token: string): string | null => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!) as CustomJwtPayload;
        return decoded.id as string; 
    } catch (error) {
        return null;
    }
};

// Service to update user status
export const updateUserStatusService = async (userId: string, status: 'online' | 'offline' | 'idle') => {
    return await User.findByIdAndUpdate(userId, {status}, {new : true});
}

// Service to authenticate user
export const authenticateUserService = async (username:string, password:string): Promise<AuthResult | null> => {
    const user = await User.findOne({ username });
    if(!user) return null;

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if(!isPasswordValid) return null;

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY as string, { expiresIn: '1h' });
    return {
        user: {
            _id: user._id as Types.ObjectId, 
            email: user.email,
            username: user.username,
            password: user.password,
            verified: user.verified,
            status: user.status,
        },
        token
    };
}






