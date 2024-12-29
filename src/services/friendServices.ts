import mongoose from 'mongoose';
import Friend from '../models/friendModel';
import { Server } from 'socket.io';
import userSocketMap from '../utils/userSocketMap';


export const checkExistFriendService = async (userId: string, friendId: string): Promise<boolean> => {
    try {
        const existingFriend = await Friend.findOne({userId, friendId, status: 'pending'});

        return existingFriend !== null;
    } catch (err) {
        console.error('Error checking existing friend request:', err);
        return false;
    }
}

//----------------------- Friend Controller Services --------------------- //

export const getAllFriendsService = async () => {
    return await Friend.find();
};


export const getFriendRequestService = async (userId:string) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid ObjectId format');
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    return await Friend.find({
        $or: [{userId: userObjectId}, {friendId: userObjectId}]
    });

};


export const updateFriendStatusService = async (
    id: string,
    status: string,
    io: Server,
    emitSocketIoUpdateFriendStatusService: Function
) => {
    const allowedStatuses = ['pending', 'accepted', 'blocked'];
    if(!allowedStatuses.includes(status)) {
        throw new Error('Invalid status');
    }

    const updatedFriend = await Friend.findByIdAndUpdate(id, { status }, { new: true });
    if (updatedFriend) {
        emitSocketIoUpdateFriendStatusService(io, updatedFriend);
    }
    return updatedFriend;
}

export const deleteFriendService = async (
    id: string,
    io: Server,
    emitSocketIoFriendRequestDeleteService: Function
  ) => {
    const deletedFriend = await Friend.findByIdAndDelete(id);
    if (deletedFriend) {
      emitSocketIoFriendRequestDeleteService(io, deletedFriend);
    }
    return deletedFriend;
};

//---------------------- Friend Socket Services -------------------------- //
export const emitSocketIoFriendRequestService = (userId:string, friendId:string, io:Server, newFriendRequest:any): void => {
    try {
        const userSocketId: string[] = userSocketMap.get(userId) || [];
        const friendSocketId: string[] = userSocketMap.get(friendId) || [];

        console.log(`Socket IDs for user:`, userSocketId);
        console.log(`Socket IDs for friend:`, friendSocketId);

       if(userSocketId.length > 0) {
        userSocketId.forEach(socketId => {
            io.to(socketId).emit('friendRequest', { message: 'New friend request sent', data: newFriendRequest })
        })
       }

       if(friendSocketId.length > 0) {
        friendSocketId.forEach(socketId => {
            io.to(socketId).emit('friendRequest', { message: 'New friend request received', data: newFriendRequest });
        })
       }
    } catch (err) {
        console.error('Error emitting friend request to following socketID', err);
    }
}

export const emitSocketIoUpdateFriendStatusService = (io:Server, updatedFriendRequest:any ): void => {
    try {
        const userId = String(updatedFriendRequest.userId);
        const friendId = String(updatedFriendRequest.friendId);
        const status = String(updatedFriendRequest.status);
        const userSocketId: string[] = userSocketMap.get(userId) || [];
        const friendSocketId: string[] = userSocketMap.get(friendId) || [];

        if(userSocketId.length > 0 && status === 'accepted') {
            userSocketId.forEach(socketId => {
                console.log(`Emitting updateFriendRequest to user socket ID: ${socketId}`);
                io.to(socketId).emit('acceptedFriendRequest', {message: 'Friend request accepted successfully', data: updatedFriendRequest});
            })
        }

        if(friendSocketId.length > 0 && status === 'accepted') {
            friendSocketId.forEach(socketId => {
                console.log(`Emitting updateFriendRequest to friend socket ID: ${socketId}`);
                io.to(socketId).emit('acceptedFriendRequest', {message: 'Friend request accepted successfully', data: updatedFriendRequest});
            })
        }
        
        if(userSocketId.length > 0 && status === 'blocked') {
            userSocketId.forEach(socketId => {
                console.log(`Emitting blockedFriendRequest to friend socket ID: ${socketId}`);
                io.to(socketId).emit('blockedFriendRequest',{message: 'Friend request blocked successfully', data:updatedFriendRequest});
            })
        }

        if(friendSocketId.length > 0 && status === 'blocked') {
            userSocketId.forEach(socketId => {
                console.log(`Emitting blockedFriendRequest to friend socket ID: ${socketId}`);
                io.to(socketId).emit('blockedFriendRequest', {message: 'Friend request blocked successfully', data:updatedFriendRequest});
            })
        }
    } catch (err) {
        console.error('Error emitting deleted friend request to following socketID', err);
    }
}

export const emitSocketIoFriendRequestDeleteService = (io:Server ,deleteFriendRequest:any): void => {
    try {
        const userId = String(deleteFriendRequest.userId);
        const friendId = String(deleteFriendRequest.friendId)
        const userSocketId: string[] = userSocketMap.get(userId) || [];
        const friendSocketId: string[] = userSocketMap.get(friendId) || [];
        if(userSocketId.length > 0) {
            userSocketId.forEach(socketId => {
                console.log(`Emitting deleteFriendRequest to user socket ID: ${socketId}`);
                io.to(socketId).emit('deleteFriendRequest', { message: 'Friend request deleted successfully', data: deleteFriendRequest })
            })
        } 
        if(friendSocketId.length > 0) {
            friendSocketId.forEach(socketId => {
                console.log(`Emitting deleteFriendRequest to friend socket ID: ${socketId}`);
                io.to(socketId).emit('deleteFriendRequest', { message: 'Friend request deleted successfully', data: deleteFriendRequest })
            })
        }
    } catch (err) {
        console.error('Error emitting deleted friend request to following socketID', err);
    }
}