import {Router} from 'express';
import {Server} from 'socket.io';
import {
    login,
    logout
} from '../controllers/authController';



const authRoutes = (io:Server) => {
    const router = Router();
    
    router.post('/auth-login',login);

    router.put('/auth-logout/:id',(req, res) => logout(req, res, io));

    return router;
}

export default authRoutes;