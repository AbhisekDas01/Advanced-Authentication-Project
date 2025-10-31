import express from 'express'
import { resendVerificationEmail, signin, signup, verifyEmail } from '../controllers/auth.controller.js';
import { verifyAccessToken } from '../middlewares/auth.middleware.js';

const authRouter = express.Router();

authRouter.post('/signup' , signup);
authRouter.post('/signin' , signin);
authRouter.get('/verify-email/:token' , verifyEmail);
authRouter.post('/resend-verification-link' , verifyAccessToken , resendVerificationEmail);

export default authRouter;