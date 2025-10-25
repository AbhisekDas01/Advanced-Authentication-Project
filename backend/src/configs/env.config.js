import {config} from "dotenv";

config({path: '.env'});

export const {

    PORT,
    DB_HOST,
    DB_PORT,
    DB_USER,
    DB_PASSWORD,
    DB_NAME,
    REDIS_URL,
    NODE_ENV,
    EMAIL_USER,
    EMAIL_PASSWORD,
    EMAIL_FROM,
    JWT_SECRET,
    FRONTEND_URL
} = process.env;