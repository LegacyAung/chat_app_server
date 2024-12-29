import Message from '../models/messageModel';
import { v4 as uuidv4 } from 'uuid';
import {Server, Socket} from 'socket.io';
import userSocketMap from '../utils/userSocketMap';


//------------------ Message Controller Service ----------------------//

// Create Message Object
export const createMessageService = async (sender: string, receiver: string, message:string) => {
    const newMessage = new Message({
        sender,
        receiver,
        message,
    })
    return await newMessage.save();
}

//Get Message Object with two user id
export const getMessageBetweenUserIdsService = async (userId1: string, userId2: string) => {
    const getMessage = await Message.find({
        $or:[
            {sender: userId1, receiver: userId2 },
            {sender: userId2, receiver: userId1}
        ]
    }).sort({ createdAt: 1})

    return getMessage;
}

//Update Message Object from user1
export const deleteMessageService = async (messageId:string, senderId:string) => {
    const message = await Message.findOneAndDelete({_id: messageId, sender: senderId});

    if(!message) {
        throw new Error('Message not found or not authorized to delete');
    }

    return message;
}


//---------------------Message Socket.io Services----------------------//
export const listenCreateRoomService = (userId:string, friendId:string, io:Server):void => {
    try {
        const userSocketId:string[] = userSocketMap.get(userId) || [];
        const friendSocketId:string[] = userSocketMap.get(friendId) || [];

        if(userSocketId.length > 0 && friendSocketId.length > 0) {
            const roomId = uuidv4();
            userSocketId.forEach(socketId => {
                const userSocket:Socket |undefined = io.sockets.sockets.get(socketId);
                if(userSocket) {
                    userSocket.join(roomId);
                }
                io.to(socketId).emit('message', {message: `You are chatting with ${friendId}`,friendId: friendId, roomId:roomId, roomVerified: true});
                console.log("message is sent successfully via socketID");
            })
            friendSocketId.forEach(socketId => {
                const friendSocket:Socket | undefined = io.sockets.sockets.get(socketId);
                if(friendSocket) {
                    friendSocket.join(roomId);
                }
                io.to(socketId).emit('message', {message: `You are chatting with ${userId}`,friendId: userId, roomId:roomId, roomVerified: true});
                console.log("message is sent successfully via socketID");
            })
        } else if (friendSocketId.length === 0) {
            userSocketId.forEach(socketId => {
                io.to(socketId).emit('friendOffline', { message: 'Your friend is offline or does not exist.' })
                console.log("There is no socket ids in friendSocketId");
            })
        }
        
    } catch(error) {
        console.error(error);
    }
}


export const receiveMessageRoomService = (roomId:string, message:string,senderUsername:string, io:Server):void => {
    try {
        io.to(roomId).emit('receivedMessage', {roomId,message,senderUsername});
        console.log(`Message sent to room ${roomId}: ${message}`);
    } catch(error) {
        console.error(error);
    }
}


