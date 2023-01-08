import mongoose, {Schema} from 'mongoose';

const TicketSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a title'],
        minlength: 3,
        maxlength: 100,
    },
    description: {
        type: String,
        required: [true, 'Please provide a description'],
        minlength: 3,
        maxlength: 500,
    },
    assigned: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
    },
    createdBy: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['Open', 'Assigned', 'Pending', 'Closed', 'In progress', 'Resolved'],
        required: [true, 'Please provide a status'],
        default: 'Open',
    },
    priority:{
        type: String,
        enum: ['Minor', 'Major', 'Critical'],
        required: [true, 'Please provide a status'],
        default: 'Minor',
    },
    impact:{
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Low',
    },
    category:{
        type: String,
        enum: ['Incident', 'Problem', 'Major Incident'],
        default: 'Incident',
        required: [true, 'A ticket must have a category'],
    },
    contact:{
        type: String,
        maxlength: 15,
    },
    product:{
        type: String,
        minlength: 3,
        maxlength: 50,
    },
    comments:[{
        comment: {
            type: String,
        },
        createdBy: {
            type: String
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    }],
}, {timestamps: true});

const Ticket = mongoose.model('Ticket', TicketSchema);

export default Ticket;