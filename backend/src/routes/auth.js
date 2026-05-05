const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { logActivity } = require('../services/activity.service');

const router = express.Router();

function buildUserResponse(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    student: user.role === 'student' && user.student
      ? {
          id: user.student.id,
          nim: user.student.nim,
          fullName: user.student.fullName,
          faculty: user.student.faculty,
          department: user.student.department,
          enrollmentYear: user.student.enrollmentYear,
          academicStatus: user.student.academicStatus,
          photoPath: user.student.photoPath,
        }
      : null,
  };
}

router.post('/login', async (req, res, next) => {
  try {
    const { email, nim, password } = req.body || {};

    if ((!email && !nim) || !password) {
      return res.status(400).json({ error: 'Email or NIM and password are required' });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: 'JWT_SECRET is not configured' });
    }

    let user;

    if (email) {
      user = await prisma.user.findUnique({
        where: { email },
        include: { student: true },
      });
    } else {
      const student = await prisma.student.findUnique({
        where: { nim },
        include: { user: true },
      });

      if (student) {
        user = {
          ...student.user,
          student: {
            id: student.id,
            nim: student.nim,
            fullName: student.fullName,
            faculty: student.faculty,
            department: student.department,
            enrollmentYear: student.enrollmentYear,
            academicStatus: student.academicStatus,
            photoPath: student.photoPath,
          },
        };
      }
    }

    if (!user) {
      await logActivity({
        actorId: null,
        actionType: 'login_failed',
        description: `Failed login attempt for ${email || nim} (user not found)`,
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      await logActivity({
        actorId: user.id,
        actionType: 'login_failed',
        description: `Failed login attempt for ${user.email} (wrong password)`,
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    await logActivity({
      actorId: user.id,
      actionType: 'user_login',
      description: `User ${user.email} logged in`,
    });

    return res.json({
      token,
      user: buildUserResponse(user),
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/logout', (req, res) => {
  res.json({ message: 'Logout successful' });
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { student: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      user: buildUserResponse(user),
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
