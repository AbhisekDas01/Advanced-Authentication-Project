import { NODE_ENV } from "../configs/env.config.js";
import APIError from "../utils/APIError.util.js";
import { ZodError } from 'zod';

const errorHandler = async (err , req , res , next) => {

    let error = err;

    // Handle Zod validation errors
    if (error instanceof ZodError) {
        
        const errors = error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message
        }));
        
        error = new APIError(400, "Validation failed", errors);
    }

    // If error is not an instance of APIError, convert it
    if (!(error instanceof APIError)) {
        const statusCode = error.statusCode || 500;
        const message = error.message || "Something went wrong";
        error = new APIError(statusCode, message, [], error.stack);
    }

    // Log error for debugging
    console.error('Error:', {
        message: error.message,
        statusCode: error.statusCode,
        errors: error.errors,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });

    // Send response
    res.status(error.statusCode).json({
        success: false,
        message: error.message,
        errors: error.errors || [],
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
};

export default errorHandler;