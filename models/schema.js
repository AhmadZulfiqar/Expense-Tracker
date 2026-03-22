const mongoose = require('mongoose');

const dailyLogSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    petrol: { type: Number, default: 0 },
    food: { type: Number, default: 0 },
    others: { type: Number, default: 0 },
    petrol_des: { type: String, default: "" },
    food_des: { type: String, default: "" },
    others_des: { type: String, default: "" },
    totalDaily: { type: Number, default: 0 }
});

// Added next() so the database finishes saving successfully
dailyLogSchema.pre('save', function (next) {
    this.totalDaily = (this.petrol || 0) + (this.food || 0) + (this.others || 0);
    next(); 
});

module.exports = mongoose.model('DailyLog', dailyLogSchema);
