import express from "express";
import { PORT } from "./configs/env.config.js";
import pool from "./configs/db.config.js";
import createTables from "./schemas/auth.schema.js";
import errorHandler from "./middlewares/globalErrorHandler.middleware.js";
import authRouter from "./routes/auth.route.js";


const app = express();

//create tables
// createTables();

app.use(express.json());

app.get('/' , (req , res) =>{
    
    res.send("Server is live");
})

//router
app.use('/api/v1/auth' , authRouter); 


//use global error handler
app.use(errorHandler);
app.listen(PORT || 5000, () => {
    console.log(`✅ Server is running: http://localhost:${PORT || 5000}`)
}).on('error', (err) => {
    console.error('❌ Server failed to start:', err.message);
});
