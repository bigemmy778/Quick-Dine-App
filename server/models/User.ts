import { Schema } from 'mongoose'
import { model, Document } from 'mongoose'

export interface IUser extends Document{
    name: string;
    email: string;
    password?: string;
    phone?: string;
    role: 'user' | 'admin' | "owner";
    createAt: Date;
    updateAt: Date;

}
 
const UserSchema = new Schema<IUser>(
    {
        name: {type: String, required: true, trim: true},
        email: {type: String, required: true, trim: true, lowercase: true, unique: true},
        password: {type: String, required: true, minlength: 6},
        phone: {type: String, trim:true, required: true, minlength: 6},
        role: {type: String, enum: ['user', 'admin', 'owner'], default: 'user'},
    },  
    {timestamps: true}
)

//Remove password from the response || when converting to JSON
UserSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.password;
        return ret;
    }
})


export const User = model<IUser>('User', UserSchema)