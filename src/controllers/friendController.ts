import mongoose from 'mongoose';
import { Request, Response } from 'express';
import { Server } from 'socket.io';
import { checkExistFriendService,
    getAllFriendsService,
    getFriendRequestService,
    updateFriendStatusService,
    deleteFriendService, 
    emitSocketIoFriendRequestService, 
    emitSocketIoFriendRequestDeleteService,
    emitSocketIoUpdateFriendStatusService
} from '../services/friendServices';
import { verifyTokenService } from '../services/authServices';
import Friend from '../models/friendModel';




// Create new friend request
export const createFriend = async (req: Request, res: Response, io:Server): Promise<void> => {
    const { userId, friendId } = req.body;
    const decodedUserId = verifyTokenService(userId) ?? '';
    // const decodedFriendId = verifyTokenService(friendId) ?? '';
    try {
        const existingFriend = await checkExistFriendService(decodedUserId, friendId);
        if (existingFriend) {
            res.status(400).json({ message: 'Friend request already sent' });
            return;
        }

        const newFriendRequest = new Friend({
            userId: decodedUserId,
            friendId,
            status: 'pending',
        });

        await newFriendRequest.save();
        emitSocketIoFriendRequestService(userId, friendId, io, newFriendRequest);
        res.status(201).json({ message: 'Friend request sent', data: newFriendRequest });
        
    } catch (err) {
        res.status(500).json({ message: 'Error creating friend', err });
    }
};


export const getAllFriends = async (req: Request, res: Response): Promise<void> => {
    try {
        const friends = await getAllFriendsService();
        res.status(200).json({data: friends});
    } catch(err) {
        res.status(500).json({message: 'Error getting all friends', err});
    }
}


export const getFriendRequests = async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.query;
    if (!userId || typeof userId !== 'string') {
        res.status(400).json({ message: 'Invalid userId' });
        return;
    }
    const decodedUserId = verifyTokenService(userId) ?? '';
    try {
        const friends = await getFriendRequestService(decodedUserId);
        if(friends.length === 0) {
            res.status(200).json({ message: 'No friends found for this user', data: []});
            return;
        }
        res.status(200).json({ data: friends });
    } catch (err) {
        res.status(500).json({ message: 'Server error', err });
    }
};


export const updateFriendStatus = async (req: Request, res: Response, io: Server): Promise<void> => {
  const { id } = req.params;
  const { status } = req.query;
  if (typeof id !== 'string' || typeof status !== 'string') {
    res.status(400).json({ message: 'Invalid id or status' });
    return;
  }
  try {
    const updatedFriend = await updateFriendStatusService(
      id,
      status,
      io,
      emitSocketIoUpdateFriendStatusService
    );
    if (!updatedFriend) {
      res.status(404).json({ message: 'Friend not found' });
      return;
    }
    res.status(200).json({ message: 'Friend status updated', data: updatedFriend });
  } catch (err) {
    res.status(500).json({ message: 'Server error', err });
  }
};


export const deleteFriend = async (req: Request, res: Response, io: Server): Promise<void> => {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ message: '_id parameter is required' });
      return;
    }
    try {
      const deletedFriend = await deleteFriendService(id, io, emitSocketIoFriendRequestDeleteService);
      if (!deletedFriend) {
        res.status(404).json({ message: 'Friend not found' });
        return;
      }
      res.status(200).json({ message: 'Friend removed' });
    } catch (err) {
      res.status(500).json({ message: 'Server error', err });
    }
};




