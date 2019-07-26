const mongoose = require('mongoose');
const { Schema } = mongoose;

const usersSchema = new Schema({
    id: { type: String, required: true },
    user: { type: String, required: true },
    name: { type: String, required: false },
    password: { type: String, require: true },
    profile: { type: String, require: true },
    uptime: { type: String, require: true },
    bytesIn: { type: Number, require: true },
    bytesOut: { type: Number, require: true },
    packetsIn: { type: Number, require: true },
    packetsOut: { type: Number, require: true },
    dynamic: { type: Boolean, require: true },
    disabled: { type: Boolean, require: true },
});

module.exports = mongoose.model('User', usersSchema);