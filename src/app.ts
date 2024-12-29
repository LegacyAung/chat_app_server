import express from 'express';
import dotenv from 'dotenv';
import connectToDatabase  from './config/db';

import userRoutes from './routes/userRoutes'; 
import friendRoutes from './routes/friendRoutes';
import authRoutes from './routes/authRoutes';
import messageRoutes from './routes/messageRoutes';

import cors from 'cors';
import {createServer} from 'node:http';
import { Server } from 'socket.io';
import { initializeSocketServer } from './socketServer';


dotenv.config();
const app = express();
const httpServer = createServer(app);


app.use(cors({
    origin: 'http://localhost:3000'
}));

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to parse Text/plain bodies
app.use(express.text());

// Initialize Socket.IO
const io = initializeSocketServer(httpServer);

// Connect to MongoDB
const startServer = async () => {
    try {
        await connectToDatabase(); // Establish the connection
        console.log('MongoDB connection established');

        // Use the user routes
        app.use('/api/users', (req, res, next) => {
            console.log('Received a user request:', req.method, req.url); // Debugging log
            next();
        }, userRoutes);

        app.use('/api/messages', (req, res, next) => {
            console.log('Received a message request:', req.method, req.url); //
            next();
        }, messageRoutes)
        
        // Use the auth routes
        app.use('/api/auth', (req, res, next) => {
            console.log('Received an auth request:', req.method, req.url);
            next();
        },authRoutes(io));

        // Use the friend routes
        app.use('/api/friends', (req, res, next) => {
            console.log('Received a friend request:', req.method, req.url); // Debugging log
            next();
        },friendRoutes(io));

        

        // Start the server
        const PORT = process.env.PORT || 5000;
        httpServer.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Error starting the server:', error);
    }
};

startServer();

