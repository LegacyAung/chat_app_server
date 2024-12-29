import { Schema, model, Document, Types } from 'mongoose';
import bcrypt from 'bcrypt';

// Define a User document interface
export interface IUser extends Document {
    _id: Types.ObjectId;
    name: string;
    username: string;
    email: string;
    password: string;
    created_at: Date;
    updated_at: Date;
    verified: boolean;
    status: 'online' | 'offline' | 'idle';
}


// Define the User schema
const userSchema = new Schema<IUser>({
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    verified: { type: Boolean, default: false },
    status: { type: String, enum: ['online', 'offline', 'idle'], default: 'offline' },    
});
  
// Middleware to update `updated_at` on document update
userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        // Hash the password if it's new or modified
        const saltRounds = 10;
        this.password = await bcrypt.hash(this.password, saltRounds);
    }
    this.updated_at = new Date();
    next();
});
  
// Create and export the User model
const User = model<IUser>('User', userSchema);
export default User;