import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../configs/env.config.js';
import crypto from "crypto";

export const generateToken = ({user_id}) => {

    return jwt.sign({user_id} , JWT_SECRET , {expiresIn: '15m'});

}


export const generateRefreshToken = async ({user_id , req}) => {

    try {

        
        
    } catch (error) {
        
    }
}