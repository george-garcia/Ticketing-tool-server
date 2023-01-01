import express from 'express';
const router = express.Router();

import {getAllUsers, getUser, updateUser, deleteUser} from '../controllers/users.js';

router.route('/').get(getAllUsers);
router.route('/:id').get(getUser).delete(deleteUser).patch(updateUser);

export default router;