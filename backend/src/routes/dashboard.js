const express = require('express');
const { ethers } = require('ethers');

const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

const router = express.Router();

router.use(authenticate, roleGuard('admin'));

router.get('/stats', async (req, res, next) => {
  try {
    const [
      totalStudents,
      totalCredentials,
      activeCredentials,
      revokedCredentials,
      expiredCredentials,
      totalVerifications,
      anchoredCredentials,
      recentCredentials,
      facultyDistribution,
      verificationResults,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.credential.count(),
      prisma.credential.count({ where: { status: 'active' } }),
      prisma.credential.count({ where: { status: 'revoked' } }),
      prisma.credential.count({ where: { status: 'expired' } }),
      prisma.verificationLog.count(),
      prisma.credential.count({ where: { blockchainTxHash: { not: null } } }),
      prisma.credential.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { student: { select: { fullName: true, nim: true } } },
      }),
      prisma.student.groupBy({ by: ['faculty'], _count: { faculty: true }, orderBy: { _count: { faculty: 'desc' } } }),
      prisma.verificationLog.groupBy({ by: ['result'], _count: { result: true } }),
    ]);

    let issuerAddress = null;
    if (process.env.ISSUER_PRIVATE_KEY) {
      try {
        const wallet = new ethers.Wallet(process.env.ISSUER_PRIVATE_KEY);
        issuerAddress = wallet.address;
      } catch {}
    }

    return res.json({
      students: { total: totalStudents },
      credentials: {
        total: totalCredentials,
        active: activeCredentials,
        revoked: revokedCredentials,
        expired: expiredCredentials,
        anchored: anchoredCredentials,
        pendingAnchor: activeCredentials - anchoredCredentials,
      },
      verifications: {
        total: totalVerifications,
        byResult: verificationResults.map(v => ({ result: v.result, count: v._count.result })),
      },
      recentCredentials: recentCredentials.map(c => ({
        id: c.id,
        credentialId: c.credentialId,
        status: c.status,
        studentName: c.student?.fullName,
        studentNim: c.student?.nim,
        issuedAt: c.issuanceDate,
        anchored: !!c.blockchainTxHash,
      })),
      facultyDistribution: facultyDistribution.map(f => ({ faculty: f.faculty, count: f._count.faculty })),
      blockchain: {
        network: 'Polygon Amoy Testnet',
        chainId: 80002,
        contractAddress: process.env.CONTRACT_ADDRESS || null,
        issuerAddress,
        configured: !!(process.env.CONTRACT_ADDRESS && process.env.POLYGON_AMOY_RPC),
      },
    });
  } catch (error) {
    return next(error);
  }
});

// GET /api/dashboard/activity — Recent activity logs
router.get('/activity', async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), 50);
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.activityLog.count(),
    ]);

    return res.json({
      data: logs,
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

module.exports = router;
