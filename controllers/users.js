import User from '../models/User.js';

const getAllUsers = async (req, res) => {
    const users = await User.find().sort('firstName');
    res.status(200).json({users, count: users.length});
}

const getUser = async (req, res) => {
    // console.log(req.params);
    const {id: requestedUser} = req.params;
    // const { userId } = req.user;

    // const job = await Job.findOne({_id: requestedJobId, createdBy: userId});
    const user = await User.findOne({_id: requestedUser});
    if(!user)
        return res.status(400).json({msg: 'User not found'});
    res.status(201).json({user});
}
// const createJob = async (req, res) => {
//     req.body.createdBy = req.user.userId;
//     // console.log(req.body);
//     const job = await Job.create(req.body);
//     res.status(201).json({job});
// }
const updateUser = async (req, res) => {
    //firstName, lastName, email, password, roles,
    const queryObject = {};
    const {id: requestedUserId} = req.params;

    const {firstName, lastName, roles} = req.body;
    if(firstName)
        queryObject.firstName = firstName;
    if(lastName)
        queryObject.lastName = lastName;
    if(roles)
        queryObject.roles = roles;

    const user = await User.updateOne({_id: requestedUserId}, queryObject);
    if(!user)
        return res.status(400).json({msg: 'User not found'});

    //Update query does not return the updated object so after updating we search again for the newly updated user and return it
    const updatedUser = await User.findOne({_id: requestedUserId});
    res.status(201).json({updatedUser});
}

const updateEmailPassword = async (req, res) => {
    try {

    } catch (e) {

    }
}

const deleteUser = async (req, res) => {
    const {id: requestedUserId} = req.params;
    // const { userId } = req.user;

    const user = await User.findByIdAndRemove({ _id: requestedUserId});
    if(!user)
        return res.status(400).json({msg: 'User not found'});

    res.status(201).send();
}

export {
    getAllUsers, getUser, updateUser, deleteUser
};