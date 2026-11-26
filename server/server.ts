import dotenv from "dotenv";
dotenv.config();
import { verifyEmailConnection } from "./config/sendEmail.js";
import express, { Request, Response, NextFunction } from 'express';
import cors from "cors";
import connectDB from "./config/db.js";
import authRouter from "./routes/authRoutes.js";
import restaurantRouter from "./routes/restaurantRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";
import ownerRouter from "./routes/ownerRoutes.js";
import adminRouter from "./routes/adminRoutes.js";


const app = express();

//connect to MongoDB
await connectDB()

verifyEmailConnection()
    .catch((error) => {
        console.error("Brevo SMTP connection failed:", error);
    });

// Middleware
const allowedOrigins = [process.env.CLIENT_URL, "http://localhost:5173"]
    .filter(Boolean)
    .map((o) => (o as string).replace(/\/+$/, ""));

app.use(
    cors({
        origin: (origin, cb) => {
            // no origin = curl, server-to-server or mobile app requests
            if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
            cb(new Error("Not allowed by CORS"));
        },
    })
);


app.use(express.json());

const port = process.env.PORT || 5000;

app.get('/', (req: Request, res: Response) => {
    res.send('Server is Live!');
});

app.use("/api/auth", authRouter)
app.use("/api/restaurants", restaurantRouter)
app.use("/api/bookings", bookingRouter)
app.use("/api/owner", ownerRouter)
app.use("/api/admin", adminRouter)

//Global error handler

//Global error handler
app.use((err: Error & { status?: number; statusCode?: number }, req: Request, res: Response, next: NextFunction) => {
    console.error("Unhandled Error", err);
    const status = err.status || err.statusCode || 500;
    const isProd = process.env.NODE_ENV === "production";

    res.status(status).json({
        message: status >= 500 && isProd ? "Internal Server Error" : err.message || "Internal Server Error",
        stack: isProd ? undefined : err.stack,
    });
});
// app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
//     console.error("Unhandled Error", err);
//     res.status(500).json({
//         message: err.message || "Internal Server Error",
//         stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
//     });
// });


app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});