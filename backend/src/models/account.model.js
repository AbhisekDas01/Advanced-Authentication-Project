
import crypto from 'crypto'
import pool from '../configs/db.config.js';
import APIError from '../utils/APIError.util.js';

const generateId = () => {

    return crypto.randomBytes(16).toString('hex')
};

export const createAccountData = async ({
    account_id = null,
    provider_id,
    user_id,
    access_token = null,
    refresh_token = null,
    id_token = null,
    access_token_expires_at = null,
    refresh_token_expires_at = null,
    scope = null,
    password = null
}) => {

    if (!user_id) {
        throw new APIError(400, "user_id is required");
    }

    if (!provider_id) {

        throw new APIError(400, "provider_id is required");
    }

    const client = await pool.connect();
    

    try {

        await client.query('BEGIN');
        //check if the user exists or not
        const userCheck = await client.query(`
            SELECT id FROM "user" WHERE id = $1
            ` , [user_id]);

        if (userCheck.rows.length === 0) {
            throw new APIError(404, 'User not found');
        }

        //check if the account already exists 
        const existingAccount = await client.query(`
                SELECT id , provider_id from "account" WHERE user_id = $1 AND provider_id = $2
            ` , [user_id, provider_id]);

        if (existingAccount.rows.length > 0) {
            throw new APIError(409, `Account with ${provider_id} already set`);
        }

        //insert account
        const newId = generateId();
        account_id = account_id? account_id : user_id; 

        const result = await client.query(`
            INSERT INTO  "account" (
                id, 
                account_id, 
                provider_id, 
                user_id, 
                access_token, 
                refresh_token, 
                id_token,
                access_token_expires_at, 
                refresh_token_expires_at,
                scope, 
                password
                
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id, account_id, provider_id, user_id, scope, created_at, updated_at`,
            [newId, account_id, provider_id, user_id, access_token, refresh_token, id_token, access_token_expires_at, refresh_token_expires_at, scope, password]
        )
        await client.query('COMMIT');

        return result.rows[0];


    } catch (error) {

        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}


export const verifyAccount = async({userId}) => {

    const client = await pool.connect();
    try {
        
        if(!userId) {
            throw new APIError(400 , "UserId not found!");
        }

        

        await client.query('BEGIN');

        const result = await client.query(`
                UPDATE "user" 
                SET email_verified = TRUE
                WHERE id = $1
                RETURNING id , email_verified
            `, [userId]);

        await client.query('COMMIT');

        return result.rows[0];
    } catch (error) {
        
        await client.query('ROLLBACK');
        throw error;
    } finally {

        client.release();
    }
}