import mongoose from 'mongoose';

const TicketSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a title'],
        minlength: 3,
        maxlength: 30,
    },
    description: {
        type: String,
        required: [true, 'Please provide a description'],
        minlength: 3,
        maxlength: 100,
    },
    assigned: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
    },
    createdBy: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
    },
    status: {
        type: String,
        enum: ['open', 'assigned', 'pending', 'closed'],
        required: [true, 'Please provide a status'],
        default: 'open',
    },
    priority:{
        type: String,
        enum: ['minor', 'major', 'critical'],
        required: [true, 'Please provide a status'],
        default: 'minor',
    },
    comments:{
        type: Array,
        default: [],
    }
}, {timestamps: true});

const Ticket = mongoose.model('Ticket', TicketSchema);

export default Ticket;