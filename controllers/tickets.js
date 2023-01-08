import Ticket from '../models/Ticket.js';
import User from '../models/User.js';

const getAllTickets = async (req, res) => {
    try {
        const tickets = await Ticket.find();
        res.status(200).json({tickets, count: tickets.length});
    } catch (e) {
        res.status(500).json({msg: e})
    }
}

const getTicket = async (req, res) => {
    try {
        // console.log(req.params);
        const {id: requestedTicket} = req.params;
        // const { userId } = req.user;

        // const job = await Job.findOne({_id: requestedJobId, createdBy: userId});
        const ticket = await Ticket.findOne({_id: requestedTicket});
        if (!ticket)
            return res.status(400).json({msg: 'Ticket not found'});
        res.status(201).json({ticket});
    } catch (e) {
        res.status(500).json({msg: e})
    }
}
const createTicket = async (req, res) => {
    try {
        // req.body.createdBy = req.user.userId;
        console.log(req.user);

        let queryObject = {
            title: req.body.title,
            description: req.body.description,
            priority: req.body.priority,
            createdBy: req.user.userId,
            category: req.body.category,
        };
        if (req.body?.status)
            queryObject.status = req.body.status
        if (req.body?.assigned) {
            queryObject.assigned = req.body.assigned;
        }
        if (req.body?.impact) {
            queryObject.impact = req.body.impact;
        }
        if (req.body?.contact) {
            queryObject.contact = req.body.contact;
        }
        if (req.body?.product) {
            queryObject.product = req.body.product;
        }

        //if the project has comments then we will push the comments into the ticket comments array after creating the ticket

        console.log(queryObject);
        //temporarily set the ticket owner to be the creator of the ticket
        // const assigned = new Map();
        // assigned.set('assigned', req.user.userId);
        // console.log(req.body);

        const ticket = await Ticket.create({...queryObject});
        if (!ticket)
            return res.status(500).json({msg: 'Something went wrong creating ticket'});

        //if comments exist on the ticket we will now push them into the comments array
        if (req.body?.comments) {

            const commentObject= {};
            commentObject.comment = req.body.comments;
            commentObject.createdBy = req.user.name;

            ticket.comments.push(commentObject);
            await ticket.save();
        }
        //map structure first name as key, object id as value
        // console.log(req.body);
        // const job = await Job.create(req.body);
        res.status(201).json({ticket});
    } catch (e) {
        res.status(500).json({msg: e})
    }
}
const updateTicket = async (req, res) => {
    try {
        const {id: ticketId} = req.params;

        // const { userId } = req.user;
        if(req.body?.assigned || req.body.assigned === null){
            const { assigned: userId } = req.body;
            /*
            if ticket has no user - add user to ticket and add ticket to user
            if ticket has a user - remove ticket from previous user, add user to this ticket, add this ticket to new user
             */
            const ticket = await Ticket.findOne({ _id: ticketId });
            // console.log(ticket);
            if(!ticket)
                return res.status(404).json({msg: 'could not get ticket'});

            //If the ticket already has a user find that user and remove this ticket from his user.tickets map
            if(ticket.assigned && ticket.assigned !== userId){
                const user = await User.findOne({ _id: ticket.assigned });
                const ticketDeletion = user.tickets.delete(ticketId);
                user.save();
                if(!ticketDeletion)
                    return res.status(500).json({msg: 'deleting ticket from user failed'});
            }

            if(userId !== null) {
                //then search for the new user and add this ticket to their map
                const user = await User.findOne({_id: userId});
                user.tickets.set(ticketId, true);
                user.save();
            }
        }

        //build our queryObject
        const queryObject = {};
        const {
            title, description, status, priority, comments: comment, assigned, impact, category, contact, product
        } = req.body;
        title ? queryObject.title = title : null;
        description ? queryObject.description = description : null;
        status ? queryObject.status = status : null;
        priority ? queryObject.priority = priority : null;
        assigned ? queryObject.assigned = assigned : null;
        impact ? queryObject.impact = impact : null;
        category ? queryObject.category = category : null;
        contact ? queryObject.contact = contact : null;
        product ? queryObject.product = product : null;

        //search for the ticket that we need to add a comment to
        if(comment) {

            const commentObject= {};
            commentObject.comment = comment;
            commentObject.createdBy = req.user.name;

            const ticket = await Ticket.findOne({_id: ticketId});
            if (!ticket)
                return res.status(400).json({msg: 'No ticket found by that ID'});

            //push the comment to the ticket.comments array and save the document
            ticket.comments.push(commentObject);
            ticket.save();
        }

        const ticket = await Ticket.updateOne({_id: ticketId}, queryObject, {new: true});
        if (!ticket)
            return res.status(400).json({msg: 'Ticket not found'});

        //Update query does not return the updated object so after updating we search again for the newly updated user and return it
        const updatedTicket = await Ticket.findOne({_id: ticketId});
        res.status(201).json({updatedTicket});

    } catch (e) {
        res.status(500).json({msg: e})
    }
}

const addComment = async (req, res) => {
    try {
        //assign the ticket id and comment to variables
        const ticketId = req.params.id;
        const { comments: comment } = req.body;

        //build our query object
        const queryObject = {}
        queryObject.comment = comment;

        //Add the creator to the comment so we know who commented
        queryObject.createdBy = req.user.name;

        //search for the ticket that we need to add a comment to
        const ticket = await Ticket.findOne({_id: ticketId});
        if(!ticket)
            return res.status(400).json({msg: 'No ticket found by that ID'});

        // push the comment to the ticket.comments array and save the document
        ticket.comments.push(queryObject);
        ticket.save();

        /*
        comments:[{
            comment: {
                type: String,
            },
            createdBy: {
                type: String
            },
            createdAt: {
                type: Data,
                default: Date.now
            },
        }],

        /*

        user.tickets.set(ticketId, true);
            user.save();
         *
         *

        if(req.body?.assigned || req.body.assigned === null){
            const { assigned: userId } = req.body;
            /*
            if ticket has no user - add user to ticket and add ticket to user
            if ticket has a user - remove ticket from previous user, add user to this ticket, add this ticket to new user
             *
        const ticket = await Ticket.findOne({ _id: ticketId });
        // console.log(ticket);
        if(!ticket)
            return res.status(404).json({msg: 'could not get ticket'});

        //If the ticket already has a user find that user and remove this ticket from his user.tickets map
        if(ticket.assigned && ticket.assigned !== userId){
            const user = await User.findOne({ _id: ticket.assigned });
            const ticketDeletion = user.tickets.delete(ticketId);
            user.save();
            if(!ticketDeletion)
                return res.status(500).json({msg: 'deleting ticket from user failed'});
        }

        if(userId !== null) {
            //then search for the new user and add this ticket to their map
            const user = await User.findOne({_id: userId});
            user.tickets.set(ticketId, true);
            user.save();
        }
    }

         */

        res.status(201).json({ticket});
    } catch (e) {
        res.status(400).json({msg: e});
    }
}

const deleteTicket = async (req, res) => {
    try {
        const {id: requestedId} = req.params;

        const ticket = await Ticket.findByIdAndRemove({_id: requestedId});
        if (!ticket)
            return res.status(400).json({msg: 'Ticket not found'});

        res.status(201).json({msg: 'deletion success'});
    } catch (e) {
        res.status(400).json({msg: e});
    }
}

export {
    getAllTickets, getTicket, createTicket, updateTicket, deleteTicket, addComment
};