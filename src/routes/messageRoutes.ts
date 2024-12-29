import {Router} from 'express';
import {
    createMessage,
    getMessage,
    deleteMessage
} from '../controllers/messageController';


const routes = Router();

routes.post('/',createMessage);

routes.get('/getMessage/:userId1/:userId2',getMessage);

routes.delete('/deleteMessage', deleteMessage);

export default routes;