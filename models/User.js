import mongoose from 'mongoose';
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken';
import Ticket from "./Ticket.js";

//firstName, lastName, email, password, roles,
const UserSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'Please provide a first name'],
        trim: true,
        lowercase: true,
        minlength: 3,
        maxlength: 30,
    },
    lastName: {
        type: String,
        required: [true, 'Please provide a last name'],
        trim: true,
        lowercase: true,
        minlength: 3,
        maxlength: 30,
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        trim: true,
        lowercase: true,
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            'Please provide a valid email'
        ],
        unique: true
    },
    password: {
        type: String,
        trim: true,
        required: [true, 'Please provide a password'],
        minlength: 6,
    },
    roles:{
        type: String,
        trim: true,
        lowercase: true,
        minlength: 3,
        maxlength: 30,
    },
    tickets:{
        type: Map,
        of: Boolean,
        default: [],
    },
    picture:{
        type: String,
        default: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8cHJvZmlsZSUyMHBpY3R1cmV8ZW58MHx8MHx8&auto=format&fit=crop&w=500&q=60',
    }
});

// UserSchema.pre('save', async function(){
//     const salt = await bcrypt.genSalt(10);
//     this.password = await bcrypt.hash(this.password,salt);
// });

UserSchema.methods.createJWT = function (){
    return jwt.sign({userId:this._id, firstName: this.firstName, name: `${this.firstName} ${this.lastName}`}, process.env.JWT_SECRET, {expiresIn: process.env.JWT_LIFETIME});
}

UserSchema.methods.comparePassword = async function (candidatePassword){
     return await bcrypt.compare(candidatePassword, this.password);

}

const User = mongoose.model('User', UserSchema);

export default User;