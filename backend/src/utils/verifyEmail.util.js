import redis from "../configs/redis.config.js";
import crypto from "crypto";


export const emailVerificationToken = async ({userId , email}) => {

    try {
        
        

        const emailToken = crypto.randomBytes(32).toString('hex');

        
        await redis.setex(`verify:${emailToken}` , 300 , JSON.stringify({userId , email}));

        return emailToken;

    } catch (error) {
        
        console.log("Error generation email verification token: " , error);
        throw error;
        
    }
}