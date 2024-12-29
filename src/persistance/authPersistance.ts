import { Server } from 'socket.io';
import userSocketMap from '../utils/userSocketMap';


export const logoutPersistance = async (usertoken:string, io:Server): Promise<boolean | undefined> => {
    try {
        const userSocketId:string[] = userSocketMap.get(usertoken) || []; 
        if(userSocketId.length === 0) {
            io.on('userDisconnected', () => {
                return true;
                // const updatedUser = await User.findByIdAndUpdate(decodedUserId, {status:'offline'}, {new: true});
                // console.log(`User status updated to offline for user:`, updatedUser);
            })
        }
        return false;
    } catch(error) {
        console.error('Error listening for request', error);
    }
}