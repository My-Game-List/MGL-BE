const mongoose = require('mongoose');

const User = mongoose.model('User', {
    id: { type: String, require: true },
    nama: { type: String, require: true },
    username: { type:String, require: true },
    email: { type: String, require: true },
    password: { type: String, require: true },
    games: {
        completed: [Object],
        plan: [Object],
        playing: [Object],
    },
    imgURL: { type: String, require: true },
    followers: { type: Array, require: true },
    followings: { type: Array, require: true },
})

module.exports = { User };