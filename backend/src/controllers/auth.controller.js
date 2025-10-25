import pool from "../configs/db.config.js";
import { FRONTEND_URL } from "../configs/env.config.js";
import redis from "../configs/redis.config.js";
import { createAccountData } from "../models/account.model.js";
import { storeSessionData } from "../models/session.model.js";
import { signupUserModel } from "../models/user.model.js";
import APIError from "../utils/APIError.util.js";
import asyncHandler from "../utils/asyncHandler.util.js";
import { sendVerificationEmail } from "../utils/email.util.js";
import { generateToken } from "../utils/generateToken.util.js";
import { signUpSchema } from "../utils/schemaValidator.util.js";
import bcrypt from 'bcryptjs'
import crypto from 'crypto';

export const signup = asyncHandler(async ( req , res) => {

    const {name , email , password} = req.body;

    if(!name , !email , !password) {
        throw new APIError(400 , "All fields are mandetory!");
    }

    //validate the data
    signUpSchema.parse({name , email , password});

    //check for user exists or not 
    const existingUser = await pool.query("select * from \"user\" where email = $1" , [email]);

    if(existingUser.rows.length > 0){
        throw new APIError(403, "Account already exists!");
    }

    const newUser = await signupUserModel({name , email });

    //save  password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password , salt);

    const result = await createAccountData({password: hashedPassword , user_id: newUser.id , provider_id: 'credential'})


    //session management

    const newSession = await storeSessionData({ip_address: req.ip , user_agent: req.headers['user-agent'] , user_id: newUser.id , }, res);

    const accessToken = generateToken({user_id: newUser.id});

    res.status(201).json({
        success: true,
        message: "A verification link has been sent  to your account please verify your account",
        token: accessToken
    })

    //verify email utility
    
    const emailToken = crypto.randomBytes(32).toString('hex');

    redis.setex(`verify:${emailToken}` , 300 , newUser.id);

    const verificationLink = `${FRONTEND_URL || 'http://localhost:5000'}/api/v1/auth/verify-email/${emailToken}`;

    sendVerificationEmail({to: newUser.email , name: newUser.name , verificationLink})

})

export const signin = asyncHandler( async ( req, res) => {

    const {email , password} = req.body;

    if(!email || !password) {
        throw new APIError(401 , "Missing credentials!");
    }

    //find the user from db


})

export const verifyEmail = asyncHandler(async (req , res)  => {

    const token = req.params.token;

    
    
})