import {Document, Schema, model} from 'mongoose';

interface IMessage extends Document {
    sender: Schema.Types.ObjectId;
    receiver: Schema.Types.ObjectId;
    message: string;
    createdAt: Date;
    updatedAt: Date;
}

const messageSchema = new Schema<IMessage>({
    sender: {type: Schema.Types.ObjectId, ref:'User', required: true},
    receiver: {type: Schema.Types.ObjectId, ref:'User', required: true},
    message: {type: String, required: true},
    createdAt: {type: Schema.Types.Date, default: Date.now},
    updatedAt: {type: Schema.Types.Date, default: Date.now}
})

const Message = model<IMessage>('Message', messageSchema);

export default Message;

