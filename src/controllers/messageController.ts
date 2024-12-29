import {Request, Response} from 'express';
import {
    createMessageService,
    getMessageBetweenUserIdsService,
    deleteMessageService
} from '../services/messageService';


export const createMessage = async (req:Request, res:Response):Promise<void> => {
    try {
        const {sender, receiver, message} = req.body;
        console.log(req.body);
        if(!sender || !receiver || !message) {
            res.status(400).json({message: 'Sender, receiver, and message are required'})
        }
        const newMessageObject = await createMessageService(sender, receiver, message);
        res.status(201).json({message: 'Message Object created', data: newMessageObject});
     } catch(err) {
        console.error(err);
        res.status(500).json({error: 'Error creating message'});
    }
}

export const getMessage = async (req: Request, res:Response): Promise<void> => {
    try {
        const {userId1, userId2} = req.params;
        console.log(req.params);
        const messages = await getMessageBetweenUserIdsService(userId1, userId2);
        res.status(200).json({message: 'Message Object sent', data: messages});
    } catch(err) {
        console.error(err);
        res.status(500).json({error: 'Error sending message'});
    }
}

export const deleteMessage = async (req:Request, res:Response):Promise<void> => {
    try {
        const {messageId, senderId} = req.params;
        const deletedMessage = await deleteMessageService(messageId, senderId);
        res.status(200).json({message: 'Message Object deleted', data: deletedMessage});
    } catch(err) {
        console.error(err);
        res.status(500).json({error: 'Error deleting message'});
    }
}