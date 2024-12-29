import { Server } from 'socket.io';
import userSocketMap from './utils/userSocketMap';

import {verifyTokenService} from './services/authServices';
import {
    listenCreateRoomService,
    receiveMessageRoomService
} from './services/messageService';

export const initializeSocketServer = (httpServer:any) => {
    const io = new Server(httpServer, {
        cors: {
            origin: 'http://localhost:3000',
            methods: ['GET', 'POST', 'PUT', 'DELETE']
        }
    });

    io.on('connection', (socket) => {
        console.log('User Connected ID: ', socket.id);
        

        socket.on('registerUser',(userId:string) => {
            const decodedUserId = verifyTokenService(userId) ?? '';
            if(!userSocketMap.has(decodedUserId)) {
                userSocketMap.set(decodedUserId,[socket.id]);
            } else {
                const socketIds = userSocketMap.get(decodedUserId) || [];
                socketIds.push(socket.id);
                userSocketMap.set(decodedUserId, socketIds);
            }
            console.log(Array.from(userSocketMap.entries()));
        })

        socket.on('registerRoom',(userId:string, friendId:string) => {
            listenCreateRoomService(userId, friendId, io);
        })

        socket.on('sendMessage', (roomId:string, message:string, senderUsername:string) => {
            console.log(`Message received in room ${roomId} : ${message}`);
            receiveMessageRoomService(roomId,message,senderUsername,io);
        })

        socket.on('disconnect', () => {
            console.log('User Disconnected:', socket.id);
            for (const [userId, socketIds] of userSocketMap.entries()) {
                const index = socketIds.indexOf(socket.id);
                if (index === -1) {
                    continue; 
                }
                socketIds.splice(index, 1);
                if (socketIds.length === 0) {
                    userSocketMap.delete(userId);
                } else {
                    userSocketMap.set(userId, socketIds);
                }
                console.log(`Updated userSocketMap for userId: ${userId}`);
                break; 
            }
            console.log('Updated userSocketMap:', Array.from(userSocketMap.entries()));
        });
        
    })


    return io;
}