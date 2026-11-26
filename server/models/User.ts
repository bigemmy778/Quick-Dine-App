
import { Schema, model, Document } from 'mongoose'

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    phone?: string;
    role: 'user' | 'admin' | 'owner';

    resetPasswordCodeHash?: string;
    resetPasswordCodeExpires?: Date;
    resetPasswordCodeAttempts?: number;

    resetPasswordToken?: string;
    resetPasswordExpires?: Date;

    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true, lowercase: true, unique: true },
        password: { type: String, required: true, minlength: 6 },
        phone: { type: String, trim: true, required: false, minlength: 6 },
        role: { type: String, enum: ['user', 'admin', 'owner'], default: 'user' },

        resetPasswordCodeHash: { type: String, select: false },
        resetPasswordCodeExpires: { type: Date, select: false },
        resetPasswordCodeAttempts: { type: Number, default: 0, select: false },

        resetPasswordToken: { type: String, select: false },
        resetPasswordExpires: { type: Date, select: false },
    },
    { timestamps: true }
)

// Remove password and password-reset fields from JSON responses
UserSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.password;
        delete ret.resetPasswordCodeHash;     // Stores the hashed six-digit code
        delete ret.resetPasswordCodeExpires;  // Code expiration time
        delete ret.resetPasswordCodeAttempts; // Tracks incorrect verification attempts
        delete ret.resetPasswordToken;        // Stores the hashed token after code verification
        delete ret.resetPasswordExpires;      // Expiration of the temporary reset authorization
        return ret;
    }
})

export const User = model<IUser>('User', UserSchema)
