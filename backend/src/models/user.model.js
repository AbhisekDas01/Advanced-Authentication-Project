import pool from "../configs/db.config.js";
import crypto from 'crypto'


const generateId = ()=> {
    return crypto.randomBytes(32).toString('hex');
}
const getRandomNumber = ( ) => {

    return Math.floor(Math.random()*100);
}

export const signupUserModel = async ({ name, email, email_verified = false, image = null, role = "user", favorite_number = getRandomNumber() }  ) => {


    const client = await pool.connect();
    try {
        
        await client.query('BEGIN');

        const userResult = await client.query(`
            INSERT INTO "user" (id , name, email, email_verified, image, role, favorite_number  )
            VALUES($1 , $2 , $3 , $4 , $5 , $6 , $7)
            RETURNING id , name , email , email_verified , image , role , favorite_number
            ` , [generateId() , name , email , email_verified , image , role , favorite_number]);

            await client.query('COMMIT');

            return userResult.rows[0];

    } catch (error) {
        
        await client.query('ROLLBACK');
        throw error;
    } finally{
        client.release();
    }


}


