import pool from '../configs/db.config.js'
import crypto from 'crypto'
import APIError from '../utils/APIError.util.js';
import { NODE_ENV } from '../configs/env.config.js';

const generateId = () => {
    return crypto.randomBytes(16).toString('hex'); // ✅ Increased from 8 to 16 bytes
}

const generateToken = () => {
    return crypto.randomBytes(64).toString('hex');
}

export const storeSessionData = async ({
    ip_address = null,
    user_agent = null,
    user_id,
    impersonated_by = null,
    expiresInDays = 30 // ✅ Changed to days instead of timestamp
}, res) => {

    if (!user_id) {
        throw new APIError(400, "user_id is required"); // ✅ Changed to 400
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // ✅ Check if user exists
        const userCheck = await client.query(
            'SELECT id FROM "user" WHERE id = $1',
            [user_id]
        );

        if (userCheck.rows.length === 0) {
            throw new APIError(404, 'User not found');
        }

        // ✅ Calculate expiration date properly
        const expires_at = new Date();
        expires_at.setDate(expires_at.getDate() + expiresInDays);

        const sessionId = generateId();
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
            [sessionId, expires_at, token, ip_address, user_agent, user_id, impersonated_by]
        );

        // ✅ Set cookie
        res.cookie('session_token', token, {
            httpOnly: true,  
            secure: NODE_ENV === 'production',     
            sameSite: 'strict',
            expires: expires_at,
            path: '/' 
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

// // ✅ Get session by token
// export const getSessionByToken = async (token) => {
//     const result = await pool.query(
//         `SELECT s.*, u.name, u.email, u.role, u.email_verified, u.banned
//          FROM "session" s
//          JOIN "user" u ON s.user_id = u.id
//          WHERE s.token = $1 AND s.expires_at > NOW()`,
//         [token]
//     );

//     if (result.rows.length === 0) {
//         return null;
//     }

//     return result.rows[0];
// };

// // ✅ Delete session (logout)
// export const deleteSession = async (token) => {
//     const result = await pool.query(
//         'DELETE FROM "session" WHERE token = $1 RETURNING id',
//         [token]
//     );

//     if (result.rows.length === 0) {
//         throw new APIError(404, 'Session not found');
//     }

//     return { success: true, message: 'Session deleted successfully' };
// };


// export const deleteAllUserSessions = async (user_id) => {
//     await pool.query(
//         'DELETE FROM "session" WHERE user_id = $1',
//         [user_id]
//     );

//     return { success: true, message: 'All sessions deleted successfully' };
// };

// // ✅ Get all active sessions for a user
// export const getUserSessions = async (user_id) => {
//     const result = await pool.query(
//         `   SELECT id, ip_address, user_agent, created_at, expires_at
//             FROM "session"
//             WHERE user_id = $1 AND expires_at > NOW()
//             ORDER BY created_at DESC`,
//         [user_id]
//     );

//     return result.rows;
// };

// // ✅ Clean up expired sessions (run periodically)
// export const cleanupExpiredSessions = async () => {
//     const result = await pool.query(
//         'DELETE FROM "session" WHERE expires_at <= NOW() RETURNING id'
//     );

//     return {
//         success: true,
//         deletedCount: result.rows.length,
//         message: `${result.rows.length} expired sessions cleaned up`
//     };
// };