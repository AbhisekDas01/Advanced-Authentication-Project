import express from 'express'
import { signup, verifyEmail } from '../controllers/auth.controller.js';

const authRouter = express.Router();

authRouter.post('/signup' , signup);
authRouter.get('/verify-email/:token' , verifyEmail);

export default authRouter;