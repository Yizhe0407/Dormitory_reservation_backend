const express = require('express');
const router = express.Router();
const Reserve = require('../models/Reserve');

// 添加或更新預約資料
router.post('/add', async (req, res) => {
  try {
    const { building, floor, room_number } = req.body;

    if (!building || !floor || !room_number) {
      return res.status(400).json({ message: '缺少必要欄位資料' });
    }

    // 查詢是否已存在該資料
    const existingReserve = await Reserve.findOne({ building, floor, room_number });

    if (existingReserve) {
      // 如果存在，更新 status 跟 inspector
      existingReserve.status = '等待檢查';
      existingReserve.inspector = "尚未檢查";
      await existingReserve.save();
      return res.status(200).json({ message: '資料已存在，status 更新為 unchecked', reserve: existingReserve });
    } else {
      // 如果不存在，新增資料
      const newReserve = new Reserve({
        building,
        floor,
        room_number,
        status: '等待檢查', // 預設 status 為 'unchecked'
      });
      await newReserve.save();
      return res.status(201).json({ message: '資料新增成功', reserve: newReserve });
    }
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ message: '伺服器錯誤', error });
  }
});

router.get('/all', async (req, res) => {
  try {
    const reserves = await Reserve.find();
    return res.status(200).json({ reserves });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ message: '伺服器錯誤', error });
  }
});

router.get('/unchecked', async (req, res) => {
  try {
    const reserves = await Reserve.find({ status: '等待檢查' });
    return res.status(200).json({ reserves });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ message: '伺服器錯誤', error });
  }
});

router.get('/pass', async (req, res) => {
  try {
    const reserves = await Reserve.find({ status: '檢查合格' });
    return res.status(200).json({ reserves });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ message: '伺服器錯誤', error });
  }
});

router.get('/failed', async (req, res) => {
  try {
    const reserves = await Reserve.find({ status: '檢查不合格' });
    return res.status(200).json({ reserves });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ message: '伺服器錯誤', error });
  }
});

router.post('/qualified', async (req, res) => {
  try {
    const { building, room_number, username } = req.body;
   
    const info = await Reserve.findOne({ building, room_number });

    if (!info) {
      return res.status(404).json({ message: '找不到該筆資料' });
    }

    info.status = '檢查合格';
    info.inspector = username;      
    await info.save();
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ message: '伺服器錯誤', error });
  }
  
});

router.post('/unqualified', async (req, res) => {
  try {
    const { building, room_number, username } = req.body;

    const info = await Reserve.findOne({ building, room_number });

    if (!info) {
      return res.status(404).json({ message: '找不到該筆資料' });
    }
    
    info.status = '檢查不合格';
    info.inspector = username;
    await info.save();
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ message: '伺服器錯誤', error });
  }
  
});

module.exports = router;
