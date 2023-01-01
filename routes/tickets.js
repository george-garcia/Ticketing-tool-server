import express from 'express';
const router = express.Router();

import {getTicket, getAllTickets, createTicket, deleteTicket, updateTicket, addComment} from '../controllers/tickets.js';

router.route('/').get(getAllTickets).post(createTicket);
router.route('/:id').get(getTicket).delete(deleteTicket).patch(updateTicket).post(addComment);

export default router;