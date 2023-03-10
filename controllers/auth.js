import User from '../models/User.js';
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';

const register = async (req, res) => {
    try {

        const {firstName, lastName, email, password} = req.body;

        const salt = await bcrypt.genSalt();
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = new User({
            firstName,
            lastName,
            email,
            password: passwordHash,
        });

        // const user = await User.create(req.body);
        const savedUser = await newUser.save();
        const token = savedUser.createJWT();
        // const token = jwt.sign({userId: user._id, name: user.name}, 'jwtsecret', {expiresIn: '30d'});
        res.status(201).json({token});
    } catch (e){
        res.status(401).json({msg: e.message});
    }
}

const login = async (req, res) => {
    try {
        const {email, password} = req.body;

        if (!email || !password)
            return res.status(400).json({msg: 'Please provide email and password'});

        const user = await User.findOne({email});
        if (!user)
            return res.status(400).json({msg: 'Invalid Credentials'});

        const isPasswordCorrect = await user.comparePassword(password);
        if (!isPasswordCorrect)
            return res.status(401).json({msg: 'Invalid Password'});

        const token = user.createJWT();
        res.status(200).json({user: {name: user.firstName}, token});
    } catch (e) {
        res.status(401).json({msg: e.message});
    }
}

export {register, login};