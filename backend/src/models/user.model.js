
import pool from "../configs/db.config.js";
import crypto from 'crypto'
import APIError from "../utils/APIError.util.js";


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


export const getUserDataModel = async ({email}) => {

    try {
        
        const result = await pool.query(`
            SELECT * FROM "user" WHERE email = $1
            ` , [email]);

        if(result.rows.length === 0) {
            throw new APIError(404 , "User not found!");
        }

        return result.rows[0];

    } catch (error) {
        
        throw error;
    }

}
