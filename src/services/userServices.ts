import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { verifyTokenService } from './authServices';
import User from '../models/userModel';

dotenv.config();



export const sendVerificationEmailService = async (email: string, verificationURL: string) => {
        
    // Create a transporter
    const transporter = nodemailer.createTransport({
        service: 'Gmail', // You can use other email services too
        auth: {
            user: process.env.MY_GMAIL_USERNAME as string, // Your email address
            pass: process.env.MY_GMAIL_PASSWORD as string, // Your email password or app-specific password
        },
        pool: true, // Enable connection pooling
        maxConnections: 5, // Adjust the number of concurrent connections as needed
        maxMessages: 10, // Max number of messages per connection
    });

    // Define email options
    const mailOptions = {
        from: process.env.MY_GMAIL_USERNAME, // Sender address
        to: email, // Recipient address
        subject: 'Verify your email', // Subject line
        text: `Please verify your email by clicking the following link: ${verificationURL}`, // Plain text body
    };

    // Send the email
    try {
        await transporter.sendMail(mailOptions);
        console.log('Verification email sent successfully');
    } catch (error) {
        console.error('Error sending verification email:', error);
        throw new Error('Could not send verification email');
    }
};

export const generateJWTTokenService = async (userId:string, username:string, expiresIn: string = '1h') => {
    const payload = {
        userId,
        username,
    }
    const token = jwt.sign(payload, process.env.JWT_SECRET_KEY as string, {expiresIn});
    return token;
}


// -------------------------------------User Services----------------------------------------------//

export const getAllUserService = async () => {
    try {
        const users = await User.find();
        return users;
    } catch(error) {
        throw new Error('Error fetching users');
    }
}

export const getUserByJWTTokenService = async (token:string) => {
    if(!token) {
        throw { status: 401, message: 'Token is required' };
    };
    const decodedJWTUserId = verifyTokenService(token);
    if(!decodedJWTUserId) {
        throw {status: 401, message:'Invalid or expired token'};
    }
    const user = await User.findById(decodedJWTUserId).select('_id username email verified status');
    if(!user) {
        throw {status: 404, message:'User not found'};
    }
    return user;
}

export const getUserByIdService = async (id:string) => {
    if(!id) {
        throw { status: 401, message: 'Token is required' };
    } 
    const user = await User.findById(id).select('_id username email verified status');
    if(!user) {
        throw {status: 404, message:'User not found'};
    }
    return user;
}




