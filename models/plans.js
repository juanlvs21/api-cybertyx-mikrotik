const mongoose = require('mongoose');
const { Schema } = mongoose;

const plansSchema = new Schema({
    id: { type: String, required: false },
    data: { type: String, required: true },
    dataType: { type: String, required: true },
    duration: { type: String, required: true },
    durationType: { type: String, required: true },
    cost: { type: Number, required: true },
    disabled: { type: Boolean, required: true },
});

module.exports = mongoose.model('Plans', plansSchema);