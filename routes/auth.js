const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const JWT_SECRET = process.env.JWT_SECRET;

// Verify token middleware
const verifyToken = (req, res, next) => {
  try {
    // 從 Authorization header 或 cookie 中獲取 token
    const authHeader = req.header('Authorization');
    const token = authHeader ? authHeader.replace('Bearer ', '') : req.cookies?.adminToken;

    if (!token) {
      return res.status(401).json({ message: '未提供認證令牌' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ message: '無效的認證令牌' });
  }
};

router.post('/register', async (req, res) => {
    try {
      const { username, password } = req.body;

      const admin = await Admin.findOne({ username });
      if (admin) {
        return res.status(400).json({ message: '管理者已存在' });
      }

      const newAdmin = new Admin({ username, password });
      await newAdmin.save();

      res.status(201).json({
        message: '註冊成功',
        admin: {
          id: newAdmin._id,
          username: newAdmin.username,
          email: newAdmin.email,
          createdAt: newAdmin.createdAt
        }
      });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: '註冊時發生錯誤' });
    }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt:', { username });

    const admin = await Admin.findOne({ username });
    if (!admin) {
      console.log('Admin not found');
      return res.status(401).json({ message: '帳號或密碼錯誤' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      console.log('Password incorrect');
      return res.status(401).json({ message: '帳號或密碼錯誤' });
    }

    // Create token
    const token = jwt.sign(
      { adminId: admin._id, username: admin.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set token in cookie
    res.cookie('adminToken', token, {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      httpOnly: true, // 防止 JavaScript 獲取，提升安全性
      secure: process.env.NODE_ENV === 'production', // 僅在 HTTPS 下傳輸（僅在生產環境啟用）
      sameSite: 'lax', // 防止跨站請求（CSRF）攻擊
      path: '/',
    });

    // Send response
    res.json({
      token,
      admin: {
        id: admin._id,
        username: admin.username
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: '登入時發生錯誤' });
  }
});

// Get current admin route
router.get('/me', verifyToken, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.adminId).select('-password');
    if (!admin) {
      return res.status(404).json({ message: '找不到管理者' });
    }
    res.json(admin);
  } catch (error) {
    console.error('Get admin error:', error);
    res.status(500).json({ message: '取得管理者資料時發生錯誤' });
  }
});

// Logout route
router.post('/logout', (req, res) => {
  res.clearCookie('adminToken', {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  res.json({ message: '登出成功' });
});

module.exports = router;
