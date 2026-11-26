import crypto from "crypto";
import { sendEmail } from "../config/sendEmail.js";
import { Request, Response } from "express";
import { User } from "../models/User.js";
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt';
import { AuthRequest } from "../middlewares/auth.js";


const generateToken = (id: string) => {
    return jwt.sign({ id }, process.env.JWT_SECRET as string, { expiresIn: "30d" })
}




//Register a new user
//POST /api/auth/register

export const registerUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, password, phone, role } = req.body
        if (!name || !email || !password) {
            res.status(400).json({ message: "Please enter all required fields" })
            return;
        }

        // NEW: check the password length before anything else uses it
        if (String(password).length < 8) {
            res.status(400).json({ message: "Password must be at least 8 characters" });
            return;
        }

        // Check if user exists
        const userExists = await User.findOne({ email })
        if (userExists) {
            res.status(400).json({ message: "user already exists" })
            return;
        }


        // NEW: only allow the two public roles
        const safeRole = role === "owner" ? "owner" : "user";

        // Hash password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        // Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            phone: phone?.trim() || undefined,
            role: safeRole,   // CHANGED from `role`
        })

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                token: generateToken(user._id.toString())
            })
        } else {
            res.status(400).json({ message: "Invalid user data " });
        }
    } catch (error: any) {
        console.error(error);
        res.status(400).json({ message: error.message });
    }
}


//Authenticate a user and get token
//POST /api/auth/register
export const loginUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body
        if (!email || !password) {
            res.status(400).json({ message: "Please provide email and password" })
            return;
        }

        // Check for user 
        const user = await User.findOne({ email })
        if (!user) {
            res.status(401).json({ message: "Invalid email or password" })
            return;
        }

        //Check if password matches (user.password is not undefined because we queried)
        const isMatch = await bcrypt.compare(password, user.password || "")
        if (!isMatch) {
            res.status(401).json({ message: "Invalid email or password" })
            return;
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            token: generateToken(user._id.toString())
        })



    } catch (error: any) {
        console.error(error);
        res.status(400).json({ message: error.message });
    }
}




//Get user profile
//POST /api/auth/me
// access private    
//..for returning the private data we will need a middleware to check if the user is authenticated or not. We will create a middleware for that in the next step.
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) { //if request doen't have user property, it means the user is not authenticated 
            res.status(401).json({ message: "Not authorized" })
            return;
        }
        res.json(req.user)
    } catch (error) {
        console.error(error)
        res.status(400).json({
            message: error instanceof Error
                ? error.message
                : "Internal server error"
        });
    }
}



//Request a password reset link
//POST /api/auth/forgot-password
// Password reset: generates a zero-padded 6-digit code, hashes it in MongoDB with a 10-min expiry, 
// resets failed attempts, clears old reset tokens, and emails the code via Nodemailer.
//
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
    const genericMessage =
        "If an account with that email exists, a verification code has been sent.";

    try {
        const email = String(req.body.email || "").trim().toLowerCase();

        if (!email) {
            res.status(400).json({ message: "Please provide your email" });
            return;
        }

        const user = await User.findOne({ email });

        if (!user) {
            res.status(200).json({ message: genericMessage });
            return;
        }

        // Generate a secure six-digit verification code
        const verificationCode = crypto.randomInt(0, 1000000)
            .toString()
            .padStart(6, "0");

        // Store only the hash of the code
        user.resetPasswordCodeHash = crypto
            .createHash("sha256")
            .update(verificationCode)
            .digest("hex");

        user.resetPasswordCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
        user.resetPasswordCodeAttempts = 0;

        // Clear any previous reset authorization
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        try {
            await sendEmail({
                to: user.email,
                subject: "Your Quick-Dine verification code",
                html: `
                    <p>Hi ${user.name},</p>
                    <p>Use the verification code below to reset your Quick-Dine password:</p>
                    <h2 style="letter-spacing: 8px; text-align: center;">
                        ${verificationCode}
                    </h2>
                    <p>This code expires in 10 minutes.</p>
                    <p>If you didn't request a password reset, you can ignore this email.</p>
                `,
            });
        } catch (emailError) {
            console.error("Email send failed:", emailError);

            user.resetPasswordCodeHash = undefined;
            user.resetPasswordCodeExpires = undefined;
            user.resetPasswordCodeAttempts = 0;

            await user.save().catch(console.error);
        }

        res.status(200).json({ message: genericMessage });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Something went wrong" });
    }
};


//Set a new password using the emailed token
//POST /api/auth/reset-password/:token

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { password, resetToken } = req.body;

        if (!password || typeof password !== "string" || password.length < 6) {
            res.status(400).json({ message: "Password must be at least 6 characters" });
            return;
        }

        if (!resetToken || typeof resetToken !== "string") {
            res.status(400).json({ message: "Invalid or expired password reset session" });
            return;
        }

        const hashedToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: new Date() },
        }).select("+resetPasswordToken +resetPasswordExpires");

        if (!user) {
            res.status(400).json({ message: "Invalid or expired password reset session" });
            return;
        }

        // password must be eigth characters

        if (!password || typeof password !== "string" || password.length < 8) {
            res.status(400).json({ message: "Password must be at least 8 characters" });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // Clear all password reset fields after successful reset
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        user.resetPasswordCodeHash = undefined;
        user.resetPasswordCodeExpires = undefined;
        user.resetPasswordCodeAttempts = 0;

        await user.save();

        res.status(200).json({
            message: "Password reset successful. You can now log in.",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Something went wrong" });
    }
};



// Verify reset code: finds user by email, validates the 6-digit code & expiry, caps wrong attempts at 5, 
// then issues a temp reset token to the frontend if valid

export const verifyResetCode = async (req: Request, res: Response): Promise<void> => {
    try {
        const email = String(req.body.email || "").trim().toLowerCase();
        const code = String(req.body.code || "").trim();

        if (!email || !/^\d{6}$/.test(code)) {
            res.status(400).json({ message: "Please enter a valid six-digit code" });
            return;
        }

        // Find the user and explicitly include the hidden verification fields
        const user = await User.findOne({ email }).select(
            "+resetPasswordCodeHash +resetPasswordCodeExpires +resetPasswordCodeAttempts"     
        );

        console.log("[verify]", {
            userFound: !!user,
            hashSet: !!user?.resetPasswordCodeHash,
            expires: user?.resetPasswordCodeExpires,
            attempts: user?.resetPasswordCodeAttempts,
        });

        if (!user || !user.resetPasswordCodeHash || !user.resetPasswordCodeExpires) {
            res.status(400).json({ message: "Invalid or expired verification code" });
            return;
        }

        // Check expiration and prevent unlimited verification attempts
        if (
            user.resetPasswordCodeExpires <= new Date() ||
            (user.resetPasswordCodeAttempts ?? 0) >= 5
        ) {
            user.resetPasswordCodeHash = undefined;
            user.resetPasswordCodeExpires = undefined;
            user.resetPasswordCodeAttempts = 0;
            await user.save();

            res.status(400).json({ message: "Invalid or expired verification code" });
            return;
        }

        // Compare the submitted code's hash with the stored hash
        const hashedCode = crypto
            .createHash("sha256")
            .update(code)
            .digest("hex");

        if (hashedCode !== user.resetPasswordCodeHash) {
            user.resetPasswordCodeAttempts = (user.resetPasswordCodeAttempts ?? 0) + 1;

            await user.save();

            res.status(400).json({ message: "Invalid or expired verification code" });
            return;
        }

        // Generate a temporary token that authorizes the final password reset
        const resetToken = crypto.randomBytes(32).toString("hex");

        user.resetPasswordToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000);

        // Consume the verification code so it cannot be reused
        user.resetPasswordCodeHash = undefined;
        user.resetPasswordCodeExpires = undefined;
        user.resetPasswordCodeAttempts = 0;

        await user.save();

        res.status(200).json({
            message: "Verification successful",
            resetToken,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Something went wrong" });
    }
};
