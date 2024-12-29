import { Router } from 'express';
import { Server } from 'socket.io';
import {
    createFriend,
    getFriendRequests,
    updateFriendStatus,
    deleteFriend,
} from '../controllers/friendController';


const friendRoutes = (io: Server) => {
    const router = Router(); // Instantiate router within the function

    // Route to create a friend request and emit via Socket.IO
    router.post('/', (req, res) => {
        createFriend(req, res, io);
    });

    // Route to get friend requests
    router.get('/', getFriendRequests);

    // Route to update friend status
    router.put('/:id', (req, res) => updateFriendStatus(req, res, io));

    // Route to delete friend
    router.delete('/:id', (req, res) => deleteFriend(req, res, io));

    return router; // Return the configured router
};

export default friendRoutes;
