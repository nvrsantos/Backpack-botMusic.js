const { Schema, model } = require('mongoose');

const Level = Schema({
    level1: Number,
    level2: Number,
    level3: Number,
    level4: Number,
    level5: Number,
    level6: Number,
    level7: Number,
    level8: Number,
    level9: Number,
    level10: Number,
    level11: Number,
    level12: Number,
    level13: Number,
    level14: Number,
    level15: Number,
});

module.exports = model('Level', Level);