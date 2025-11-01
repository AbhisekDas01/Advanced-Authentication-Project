import pool from "../configs/db.config.js";
import { FRONTEND_URL } from "../configs/env.config.js";
import redis from "../configs/redis.config.js";
import { createAccountData, verifyAccount } from "../models/account.model.js";
import { deleteSession, getSessionByToken, storeSessionData } from "../models/session.model.js";
import { getUserDataModel, signupUserModel } from "../models/user.model.js";
import APIError from "../utils/APIError.util.js";
import asyncHandler from "../utils/asyncHandler.util.js";
import { sendVerificationEmail } from "../utils/email.util.js";
import { generateToken } from "../utils/generateToken.util.js";
import { signUpSchema } from "../utils/schemaValidator.util.js";
import bcrypt from 'bcryptjs'
import { emailVerificationToken } from "../utils/verifyEmail.util.js";




export const signup = asyncHandler(async ( req , res) => {

    const {name , email , password} = req.body;

    if(!name || !email || !password) {
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

   

    //verify email utility
    
    const emailToken = await emailVerificationToken({userId: newUser.id , email: newUser.email});

    const verificationLink = `${FRONTEND_URL || 'http://localhost:5000'}/api/v1/auth/verify-email/${emailToken}`;

    sendVerificationEmail({to: newUser.email , name: newUser.name , verificationLink});

    res.status(201).json({
        success: true,
        message: "A verification link has been sent  to your account please verify your account",
        token: accessToken
    })

})

export const signin = asyncHandler( async ( req, res) => {

    const {email , password} = req.body;

    if(!email || !password) {
        throw new APIError(401 , "Missing credentials!");
    }

    //find user from db
    const userData = await pool.query(`

        SELECT 
            u.id , u.name , u.email , u.role  ,  u.email_verified, u.banned, a.password as hashedpassword 
            FROM "user" u 
            LEFT JOIN "account" a ON u.id = a.user_id AND a.provider_id = 'credential'
            WHERE u.email = $1
        `, [email]
    );


    

    if(userData.rows.length === 0){
        throw new APIError(404 , "User with this email does not exists!");
    }

    const user = userData.rows[0];

    
    

    if (user.banned) {
        throw new APIError(403, "This account has been banned.");
    }

    if (!user.hashedpassword) {
        throw new APIError(400, "Password is not set for this account. Try a different login method.");
    }

    
    

    //compare password
    const passwordMatch = await bcrypt.compare(password , user.hashedpassword);

    if(!passwordMatch){
        throw new APIError(401 , "Wrong password!");
    }

    //generate token 
    const token = generateToken({user_id: user.id});

    const newSession = await storeSessionData({ip_address: req.ip , user_agent: req.headers['user-agent'] , user_id: user.id} , res);

    res.json({
        message: "login success",
        token
    })


})

export const verifyEmail = asyncHandler(async (req , res)  => {

    const token = req.params.token;

    if(!token){
        throw new APIError(400 , "Verification link corrupted! please request a new one!");
    }

    const emailToken = `verify:${token}`;

    const userData = await redis.get(emailToken);

    if(!userData){
        throw new APIError(400 , "Verification link has been expired!");
    }

    const { userId, email } = JSON.parse(userData);

    //verify existing user
    const userCheck = await pool.query(`
        SELECT id , email_verified FROM "user" WHERE id = $1
        `, [userId] 
    )

    if(userCheck.rows.length == 0) {
        throw new APIError(404 , "User not found!");
    }

    if(userCheck.rows[0].email_verified){
        throw new APIError(400 , "Email is already verified");
    }

    //find in db and verify;
    const result = await verifyAccount({userId: userId});

    await redis.del(emailToken);

    if(result.email_verified) {
        return res.status(200).json({
            success: true,
            message: "Account verifed successfully"
        })
    } else {
        throw new APIError(400 , "Error while verifying account! please try again");
    }
    
})

export const resendVerificationEmail = asyncHandler(async(req , res) => {

    const user = req.user;

    if(user.email_verified){
        throw new APIError(403 , "Email already verfied!");
    }


    //send verification email
    const emailToken = await emailVerificationToken({userId: user.id , email: user.email});

    const verificationLink = `${FRONTEND_URL || 'http://localhost:5000'}/api/v1/auth/verify-email/${emailToken}`;

    sendVerificationEmail({to: user.email , name: user.name , verificationLink}).then(() => {
        res.json({
            message: "Verification link sent successfully"
        })
    }).catch((error) => {
        throw error;
    })

    
})


export const refreshAccessToken = asyncHandler (async( req, res) => {

    const refreshToken  = req.cookies?.session_token;

    if(!refreshToken){

        throw new APIError(401 , "Session expired or invalid. Please login again");
    }

    

    const session = await getSessionByToken(refreshToken);

    

    //delete the session
    await deleteSession(refreshToken);

     const newSession = await storeSessionData({
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        user_id: session.id
    }, res);

    const token = generateToken({user_id: session.id});

    res.json({
        success: true,
        message: "Session refreshed successfully.",
        token
    })
})

export const signout = asyncHandler( async ( req , res) => {

    const refreshToken = req.cookies?.session_token;

    if(refreshToken) {
        try {
            await deleteSession(refreshToken);
        } catch (error) {
            
        }
    }

        res.clearCookie('session_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
    });

    res.status(200).json({ success: true, message: "Signed out successfully." });

})

export const singoutFromADevice = asyncHandler (async (req , res) => {

    const sessionId = req.body.sessionId;
    const userId = req.user.id;

    if(!sessionId) {
        throw new APIError(400 , "Session not found!")
    }

    const sessionData = await pool.query(`
        DELETE FROM "session" 
        WHERE id = $1 AND user_id = $2
        RETURNING user_agent` , [sessionId , userId]);

     if (sessionData.rows.length === 0) {
        // This happens if the session ID is invalid or belongs to another user.
        throw new APIError(404, "Session not found or you do not have permission to remove it.");
    }

    return res.json({
        message: `Logged out from ${sessionData.rows[0].user_agent}`
    })
})

export const signoutFromAllDeviceExpectLoggedin = asyncHandler (async (req , res) => {

    
    const currentRefreshToken = req.cookies?.session_token;
    const userId = req.user.id;

    if(!currentRefreshToken){
        throw new APIError(401, "Current session not found. Please log in again.");
    }

    const { rows: deletedSessions } = await pool.query(`
        DELETE FROM "session" 
        WHERE user_id = $1 AND token != $2
        RETURNING id
        `, 
        [userId, currentRefreshToken]
    );

    const deletedCount = deletedSessions.length;

    if (deletedCount > 0) {
        return res.json({
            success: true,
            message: `Successfully signed out from ${deletedCount} other device(s).`
        });
    } else {
        return res.json({
            success: true,
            message: "No other active sessions found."
        });
    }
});