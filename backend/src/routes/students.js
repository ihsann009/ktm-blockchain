const express = require('express');
const bcrypt = require('bcryptjs');

const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const { logActivity } = require('../services/activity.service');
const { validatePassword } = require('../utils/validation');

const router = express.Router();

router.use(authenticate, roleGuard('admin'));

function mapStudent(student) {
  const latestCredential = student.credentials?.[0] || null;
  return {
    id: student.id,
    userId: student.userId,
    email: student.user?.email || null,
    nim: student.nim,
    fullName: student.fullName,
    faculty: student.faculty,
    department: student.department,
    enrollmentYear: student.enrollmentYear,
    academicStatus: student.academicStatus,
    photoPath: student.photoPath,
    createdAt: student.createdAt,
    updatedAt: student.updatedAt,
    credential: latestCredential
      ? {
          status: latestCredential.status,
          blockchainTxHash: latestCredential.blockchainTxHash,
          credentialId: latestCredential.credentialId,
        }
      : null,
  };
}

router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), 100);
    const skip = (page - 1) * limit;
    const search = req.query.search?.trim() || '';

    const where = search
      ? {
          OR: [
            { nim: { contains: search, mode: 'insensitive' } },
            { fullName: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { email: true },
          },
          credentials: {
            orderBy: { issuanceDate: 'desc' },
            take: 1,
            select: {
              status: true,
              blockchainTxHash: true,
              credentialId: true,
            },
          },
        },
      }),
      prisma.student.count({ where }),
    ]);

    return res.json({
      data: students.map(mapStudent),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const {
      email,
      password,
      nim,
      fullName,
      faculty,
      department,
      enrollmentYear,
    } = req.body || {};

    if (!email || !password || !nim || !fullName || !faculty || !department || !enrollmentYear) {
      return res.status(400).json({
        error: 'email, password, nim, fullName, faculty, department, and enrollmentYear are required',
      });
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({ error: passwordCheck.message });
    }

    const parsedEnrollmentYear = Number.parseInt(enrollmentYear, 10);
    if (Number.isNaN(parsedEnrollmentYear)) {
      return res.status(400).json({ error: 'enrollmentYear must be a valid number' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const student = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: 'student',
        },
      });

      return tx.student.create({
        data: {
          userId: user.id,
          nim,
          fullName,
          faculty,
          department,
          enrollmentYear: parsedEnrollmentYear,
        },
        include: {
          user: {
            select: { email: true },
          },
        },
      });
    });

    await logActivity({
      actorId: req.user.userId,
      actionType: 'student_created',
      description: `Student ${student.fullName} (${student.nim}) was created`,
    });

    return res.status(201).json({ data: mapStudent(student) });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Student email or NIM already exists' });
    }

    return next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: { email: true },
        },
        credentials: {
          orderBy: { issuanceDate: 'desc' },
          take: 1,
          select: {
            status: true,
            blockchainTxHash: true,
            credentialId: true,
          },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    return res.json({ data: mapStudent(student) });
  } catch (error) {
    return next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const allowedFields = ['nim', 'fullName', 'faculty', 'department', 'enrollmentYear', 'academicStatus', 'photoPath'];
    const criticalFields = ['nim', 'fullName', 'faculty', 'department', 'enrollmentYear'];
    const updateData = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    if (updateData.enrollmentYear !== undefined) {
      const parsedEnrollmentYear = Number.parseInt(updateData.enrollmentYear, 10);
      if (Number.isNaN(parsedEnrollmentYear)) {
        return res.status(400).json({ error: 'enrollmentYear must be a valid number' });
      }

      updateData.enrollmentYear = parsedEnrollmentYear;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid student fields provided for update' });
    }

    const currentStudent = await prisma.student.findUnique({
      where: { id: req.params.id },
    });

    if (!currentStudent) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const changedCriticalFields = criticalFields.filter(
      (f) => updateData[f] !== undefined && String(updateData[f]) !== String(currentStudent[f])
    );

    const activeCredential = await prisma.credential.findFirst({
      where: { studentId: req.params.id, status: 'active' },
    });

    const student = await prisma.student.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        user: {
          select: { email: true },
        },
      },
    });

    const credentialWarning = (changedCriticalFields.length > 0 && activeCredential)
      ? `Critical fields changed (${changedCriticalFields.join(', ')}). Active credential contains stale data — re-issue recommended.`
      : null;

    await logActivity({
      actorId: req.user.userId,
      actionType: 'student_updated',
      description: `Student ${student.fullName} (${student.nim}) was updated. Fields: ${Object.keys(updateData).join(', ')}${credentialWarning ? '. WARNING: ' + credentialWarning : ''}`,
    });

    return res.json({
      data: mapStudent(student),
      warning: credentialWarning,
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Student NIM already exists' });
    }

    return next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.id },
      include: {
        credentials: {
          where: { status: 'active' },
          select: { credentialId: true },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (student.credentials.length > 0) {
      return res.status(409).json({
        error: 'Cannot delete student with active credentials. Revoke all credentials first.',
        activeCredentials: student.credentials.map((c) => c.credentialId),
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.student.delete({ where: { id: req.params.id } });
      await tx.user.delete({ where: { id: student.userId } });
    });

    await logActivity({
      actorId: req.user.userId,
      actionType: 'student_deleted',
      description: `Student ${student.fullName} (${student.nim}) was deleted`,
    });

    return res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Student not found' });
    }

    return next(error);
  }
});

module.exports = router;
