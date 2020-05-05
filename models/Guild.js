const { Schema, model } = require('mongoose');

const Guild = Schema({
    channel: String
});

module.exports = model('Guild', Guild);