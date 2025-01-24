const mongoose = require('mongoose');

const reserveSchema = new mongoose.Schema({
    building: {
        type: String,
        required: true
    },
    floor: {
        type: String,
        required: true
    },
    room_number: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: '等待檢查'
    },
    inspector: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// 在 building, floor 和 room_number 上建立複合唯一索引，確保不會有相同的樓層和房間號
reserveSchema.index({ building: 1, floor: 1, room_number: 1 }, { unique: true });

const Reserve = mongoose.model('Reserve', reserveSchema);
module.exports = Reserve;
