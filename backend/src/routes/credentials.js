const express = require('express');

const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const { logActivity } = require('../services/activity.service');
const { generateCredential } = require('../services/credential.service');
const blockchain = require('../services/blockchain.service');

const router = express.Router();

router.use(authenticate);

function mapCredential(credential) {
  return {
    id: credential.id,
    studentId: credential.studentId,
    credentialId: credential.credentialId,
    jwtToken: credential.jwtToken,
    credentialHash: credential.credentialHash,
    issuanceDate: credential.issuanceDate,
    expirationDate: credential.expirationDate,
    status: credential.status,
    blockchainTxHash: credential.blockchainTxHash,
    previousCredentialId: credential.previousCredentialId,
    createdAt: credential.createdAt,
    updatedAt: credential.updatedAt,
    student: credential.student
      ? {
          id: credential.student.id,
          userId: credential.student.userId,
          nim: credential.student.nim,
          fullName: credential.student.fullName,
          faculty: credential.student.faculty,
          department: credential.student.department,
          enrollmentYear: credential.student.enrollmentYear,
          academicStatus: credential.student.academicStatus,
          photoPath: credential.student.photoPath,
          email: credential.student.user?.email || null,
        }
      : null,
  };
}

function canAccessStudent(req, studentUserId) {
  return req.user.role === 'admin' || (req.user.role === 'student' && req.user.userId === studentUserId);
}

/**
 * Issue a credential for a student. Reusable helper.
 * @param {object} student - Student record with user.email included
 * @param {string} actorId - ID of the admin performing the action
 * @returns {object} The created credential (mapped)
 */
async function issueCredentialForStudent(student, actorId) {
  // Check for existing active credential — auto-revoke if found
  const existingActive = await prisma.credential.findFirst({
    where: { studentId: student.id, status: 'active' },
    orderBy: { issuanceDate: 'desc' },
  });

  if (existingActive) {
    // Revoke on blockchain if anchored
    if (blockchain.isConfigured() && existingActive.blockchainTxHash) {
      try {
        await blockchain.revokeOnChain(existingActive.credentialId);
      } catch (err) {
        console.error('Blockchain revocation of previous credential failed:', err.message);
      }
    }

    // Mark old credential as revoked in DB
    await prisma.credential.update({
      where: { id: existingActive.id },
      data: { status: 'revoked' },
    });

    await logActivity({
      actorId,
      actionType: 'credential_revoked',
      description: `Credential ${existingActive.credentialId} auto-revoked (replaced by new issuance) for student ${student.nim}`,
    });
  }

  const credentialPayload = await generateCredential(student);

  let blockchainTxHash = null;
  if (blockchain.isConfigured()) {
    try {
      blockchainTxHash = await blockchain.anchorCredential(
        credentialPayload.credentialId,
        credentialPayload.credentialHash,
        credentialPayload.issuanceDate,
        credentialPayload.expirationDate
      );
    } catch (err) {
      console.error('Blockchain anchoring failed:', err.message);
    }
  }

  const credential = await prisma.credential.create({
    data: {
      studentId: student.id,
      credentialId: credentialPayload.credentialId,
      jwtToken: credentialPayload.jwt,
      credentialHash: credentialPayload.credentialHash,
      issuanceDate: credentialPayload.issuanceDate,
      expirationDate: credentialPayload.expirationDate,
      status: 'active',
      blockchainTxHash,
      previousCredentialId: existingActive ? existingActive.credentialId : null,
    },
    include: {
      student: {
        include: {
          user: {
            select: { email: true },
          },
        },
      },
    },
  });

  await logActivity({
    actorId,
    actionType: 'credential_issued',
    description: `Credential ${credential.credentialId} issued for student ${student.nim}${existingActive ? ` (replaces ${existingActive.credentialId})` : ''}${blockchainTxHash ? ` (tx: ${blockchainTxHash})` : ' (pending_anchor)'}`,
  });

  return mapCredential(credential);
}

router.post('/issue/:studentId', roleGuard('admin'), async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.studentId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const result = await issueCredentialForStudent(student, req.user.userId);
    return res.status(201).json({ data: result });
  } catch (error) {
    return next(error);
  }
});

router.get('/student/:studentId', async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.studentId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (!canAccessStudent(req, student.userId)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const credentials = await prisma.credential.findMany({
      where: { studentId: student.id },
      orderBy: { issuanceDate: 'desc' },
      include: {
        student: {
          include: {
            user: {
              select: { email: true },
            },
          },
        },
      },
    });

    return res.json({ data: credentials.map(mapCredential) });
  } catch (error) {
    return next(error);
  }
});

router.get('/:credentialId', async (req, res, next) => {
  try {
    const credential = await prisma.credential.findUnique({
      where: { credentialId: req.params.credentialId },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!credential) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    if (!canAccessStudent(req, credential.student.userId)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    return res.json({ data: mapCredential(credential) });
  } catch (error) {
    return next(error);
  }
});

router.post('/retry-anchor/:credentialId', roleGuard('admin'), async (req, res, next) => {
  try {
    if (!blockchain.isConfigured()) {
      return res.status(503).json({ error: 'Blockchain service not configured' });
    }

    const credential = await prisma.credential.findUnique({
      where: { credentialId: req.params.credentialId },
    });

    if (!credential) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    if (credential.blockchainTxHash) {
      return res.status(400).json({ error: 'Credential is already anchored on-chain' });
    }

    if (credential.status !== 'active') {
      return res.status(400).json({ error: 'Only active credentials can be anchored' });
    }

    const txHash = await blockchain.anchorCredential(
      credential.credentialId,
      credential.credentialHash,
      credential.issuanceDate,
      credential.expirationDate
    );

    const updated = await prisma.credential.update({
      where: { id: credential.id },
      data: { blockchainTxHash: txHash },
      include: {
        student: {
          include: { user: { select: { email: true } } },
        },
      },
    });

    await logActivity({
      actorId: req.user.userId,
      actionType: 'credential_anchored',
      description: `Credential ${credential.credentialId} anchored on-chain (retry) (tx: ${txHash})`,
    });

    return res.json({ data: mapCredential(updated) });
  } catch (error) {
    return next(error);
  }
});

router.post('/retry-anchor-all', roleGuard('admin'), async (req, res, next) => {
  try {
    if (!blockchain.isConfigured()) {
      return res.status(503).json({ error: 'Blockchain service not configured' });
    }

    const pending = await prisma.credential.findMany({
      where: { blockchainTxHash: null, status: 'active' },
      orderBy: { issuanceDate: 'asc' },
    });

    if (pending.length === 0) {
      return res.json({ message: 'No pending credentials to anchor', results: [] });
    }

    const results = [];
    for (const cred of pending) {
      try {
        const txHash = await blockchain.anchorCredential(
          cred.credentialId,
          cred.credentialHash,
          cred.issuanceDate,
          cred.expirationDate
        );

        await prisma.credential.update({
          where: { id: cred.id },
          data: { blockchainTxHash: txHash },
        });

        results.push({ credentialId: cred.credentialId, status: 'anchored', txHash });
      } catch (err) {
        results.push({ credentialId: cred.credentialId, status: 'failed', error: err.message });
      }
    }

    const anchored = results.filter((r) => r.status === 'anchored');
    if (anchored.length > 0) {
      await logActivity({
        actorId: req.user.userId,
        actionType: 'batch_anchor',
        description: `Batch anchored ${anchored.length}/${pending.length} credentials on-chain`,
      });
    }

    return res.json({ message: `Processed ${pending.length} credentials`, results });
  } catch (error) {
    return next(error);
  }
});

router.post('/revoke/:credentialId', roleGuard('admin'), async (req, res, next) => {
  try {
    const existingCredential = await prisma.credential.findUnique({
      where: { credentialId: req.params.credentialId },
    });

    if (!existingCredential) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    if (existingCredential.status === 'revoked') {
      return res.status(400).json({ error: 'Credential is already revoked' });
    }

    let revokeTxHash = null;
    if (blockchain.isConfigured() && existingCredential.blockchainTxHash) {
      try {
        revokeTxHash = await blockchain.revokeOnChain(req.params.credentialId);
      } catch (err) {
        console.error('Blockchain revocation failed:', err.message);
      }
    }

    const credential = await prisma.credential.update({
      where: { credentialId: req.params.credentialId },
      data: { status: 'revoked' },
      include: {
        student: {
          include: {
            user: {
              select: { email: true },
            },
          },
        },
      },
    });

    await logActivity({
      actorId: req.user.userId,
      actionType: 'credential_revoked',
      description: `Credential ${credential.credentialId} was revoked${revokeTxHash ? ` (tx: ${revokeTxHash})` : ''}`,
    });

    return res.json({ data: mapCredential(credential) });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
module.exports.issueCredentialForStudent = issueCredentialForStudent;
