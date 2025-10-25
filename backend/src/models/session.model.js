import pool from '../configs/db.config.js'
import crypto from 'crypto'
import APIError from '../utils/APIError.util.js';
import { NODE_ENV } from '../configs/env.config.js';

const generateId = () => {

    return crypto.randomBytes(8).toString('hex');
}

const generateToken = () => {

    return crypto.randomBytes(64).toString('hex');
}

export const storeSessionData = async ({
    ip_address = null,
    user_agent = null,
    user_id,
    impersonated_by = null,
    expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
} , res) => {


    const client = await pool.connect();


    try {

        await client.query("BEGIN");

        if (!user_id) {
            throw new APIError(403, "user_id not present ");
        }

        const token = generateToken();


        const result = await client.query(`
                INSERT INTO "session" (
                id,
                expires_at,
                token,
                created_at,
                updated_at,
                ip_address,
                user_agent,
                user_id,
                impersonated_by
            )
            VALUES ($1, $2, $3, NOW(), NOW(), $4, $5, $6, $7)
            RETURNING id, token, expires_at, created_at, ip_address, user_agent, user_id`,
            [generateId(), expires_at, token, ip_address, user_agent, user_id, impersonated_by]
        )

        res.cookie('session_token', token, {
            httpOnly: true,  
            secure: NODE_ENV === 'production',     
            sameSite: 'strict',
            expires: expires_at
        });

        await client.query("COMMIT");

        return result.rows[0];


    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}