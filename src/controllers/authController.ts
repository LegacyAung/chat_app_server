import { Request, Response } from 'express';
import {Server} from 'socket.io';
import {
    updateUserStatusService, 
    authenticateUserService,
    generateEncryptedIdService,
    verifyTokenService,
} from '../services/authServices';
import { logoutPersistance } from '../persistance/authPersistance';



export const login = async (req:Request, res:Response):Promise<void> => {
    try {
        const {username, password} = req.body;
        const authResult = await authenticateUserService(username, password);
        
        if(!authResult) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const userId = authResult.user._id.toString();
        const encryptedId = generateEncryptedIdService(userId);
        await updateUserStatusService(userId, 'online');
        res.status(200).json({ 
            message: 'Logged in successfully', 
            token: authResult.token, 
            user: authResult.user,
            encryptedId: encryptedId
        });
    } catch(err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred during login' });
    }
}

export const logout = async (req:Request, res:Response, io:Server ):Promise<void> => {
    try {
        const token = req.params.id;
        if(!token) {
            res.status(401).json({message: 'Token is required'});
        }
        
        const decodedUserId = verifyTokenService(token) ?? '';
        if(!decodedUserId) {
            res.status(401).json({message: 'Invalid or expired token'});
        }
        const isUserLoggedOut = await logoutPersistance(token, io);
        if(isUserLoggedOut) {
            await updateUserStatusService(decodedUserId, 'offline');
            res.status(200).json({message: 'Logged out successfully'});
        } else {
            res.status(400).json({message: 'Logout failed. User may already be disconnected.'});
        }
    } catch(err) {
        console.error(err);
        res.status(500).json({error: 'An error occurred during logout' });
    }
}