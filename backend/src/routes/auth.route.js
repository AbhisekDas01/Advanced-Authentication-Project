import express from 'express'
import { 
    refreshAccessToken, 
    resendVerificationEmail, 
    signin, 
    signout, 
    signup, 
    singoutFromADevice, 
    verifyEmail 
} from '../controllers/auth.controller.js';
import { verifiedAccountPath, verifyAccessToken } from '../middlewares/auth.middleware.js';

const authRouter = express.Router();

authRouter.post('/signup' , signup);
authRouter.post('/signin' , signin);
authRouter.get('/verify-email/:token' , verifyEmail);
authRouter.post('/resend-verification-link' , verifyAccessToken , resendVerificationEmail);
authRouter.post('/refresh-access-token' , refreshAccessToken);
authRouter.post('/signout' , verifyAccessToken , signout);
authRouter.post('/singout-other-device' , verifyAccessToken , verifiedAccountPath , singoutFromADevice );

export default authRouter;