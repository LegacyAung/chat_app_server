import { Document, Schema, model } from 'mongoose';

export interface IFriend extends Document {
    userId: Schema.Types.ObjectId;      // The ID of the user who has the friend
    friendId: Schema.Types.ObjectId;    // The ID of the friend
    status: 'pending' | 'accepted' | 'blocked';      // Friendship status (e.g., "pending", "accepted", "blocked")
    createdAt: Date;     // When the friendship was created
    updatedAt: Date;
}

const friendSchema = new Schema<IFriend>({
    userId: {type: Schema.Types.ObjectId, required: true, ref:'User'},
    friendId: {type: Schema.Types.ObjectId, required: true, ref:'User'},
    status: {
        type: String,
        enum: ['pending', 'accepted', 'blocked'],
        default: 'pending',
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now},
})


friendSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
})



const Friend = model<IFriend>('Friend', friendSchema);

export default Friend;