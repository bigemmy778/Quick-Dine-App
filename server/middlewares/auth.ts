
import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import { IUser, User } from "../models/User.js";

 export interface AuthRequest extends Request{
    user?: IUser;
 }

 export const protect = async (req: AuthRequest, res: Response, next: NextFunction):
 Promise<void> => {
     
    let token;

    if(req.headers.authorization && req.headers.authorization.startsWith("Bearer")){
        try{
            //Get token from header
            token = req.headers.authorization.split(" ")[1];

            //verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {id: string};

            //Get user from the token, exclude password
            const user = await User.findById(decoded.id).select("-password");
            if(!user){
               res.status(401).json({ message: "Not authorized, user not found" });
               return;  
            }

            req.user = user;
            next() // execute controller using next()
        } catch  (error) {
            console.error("Auth Middleware Error:", error);
        }
    }
    if(!token){
        res.status(401).json({ message: "Not authorized, no token" });
    }
 }

//middle ware to check if user is admin and protect admin routes
 export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction): void => {
    if(req.user && req.user.role === "admin"){
        next();// execute controller using next()
    } else {
        res.status(403).json({ message: "Access denied, admin only" });
    }
 }
//middle ware to check if user is owner and protect owner routes
 export const ownerOnly = (req: AuthRequest, res: Response, next: NextFunction): void => {
    //admin can also access owner routes && dashboard
    if(req.user && ( req.user.role === "owner" || req.user.role === "admin" )){
        next(); // execute controller using next()
    } else {
        res.status(403).json({ message: "Access denied, restaurant owner role required" });
    }
 }