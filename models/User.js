const { Schema, model } = require('mongoose');

const User = Schema({
    id: String,
    level: Number,
    xp: Number,
});

module.exports = model('User', User);