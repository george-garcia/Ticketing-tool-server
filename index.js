import express from 'express';
import mongoose from "mongoose";
import dotenv from 'dotenv';
import helmet from "helmet";
import morgan from 'morgan';
import authRoute from './routes/auth.js';
import userRoute from './routes/users.js';
import ticketRoute from './routes/tickets.js'
import cors from 'cors';

//authentication middleware
import authenticateUser from './middleware/authentication.js';

//dotenv package for global variables
dotenv.config();

//for express middleware
const app = express();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("dev"));
app.use(cors());

/* ROUTES */
app.use('/api/v1/auth', authRoute); //authRoutes
app.use('/api/v1/users', authenticateUser, userRoute); //userRoutes
app.use('/api/v1/tickets', authenticateUser, ticketRoute); //ticketRoutes
// app.use('/api/v1/teams'); //teamRoutes


//MONGOOSE SETUP
const port = process.env.PORT || 3001;
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    app.listen(port, () => console.log(`Listening on Server Port: ${port}`));
}).catch((error) => console.log(`${error} did not connect`));
