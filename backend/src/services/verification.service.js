const { createHash } = require('crypto');
const { jwtVerify, importJWK } = require('jose');
const prisma = require('../config/database');
const blockchain = require('./blockchain.service');
const { getIssuerPublicJwk } = require('./credential.service');

const RESULT = {
  VALID: 'valid',
  VALID_UNANCHORED: 'valid_unanchored',
  NOT_FOUND: 'not_found',
  INVALID_SIGNATURE: 'invalid_signature',
  HASH_MISMATCH: 'hash_mismatch',
  REVOKED: 'revoked',
  EXPIRED: 'expired',
};

async function verifyCredential(credentialId) {
  const credential = await prisma.credential.findUnique({
    where: { credentialId },
    include: {
      student: true,
    },
  });

  if (!credential) {
    return { result: RESULT.NOT_FOUND, credential: null, student: null };
  }

  const jwtString = credential.jwtToken;

  const publicJwk = await getIssuerPublicJwk();
  const publicKey = await importJWK(publicJwk, 'ES256K');

  let payload;
  try {
    const verified = await jwtVerify(jwtString, publicKey, {
      algorithms: ['ES256K'],
    });
    payload = verified.payload;
  } catch (err) {
    if (err.code === 'ERR_JWT_EXPIRED') {
      await logVerification(credentialId, RESULT.EXPIRED);
      return {
        result: RESULT.EXPIRED,
        credential: mapCredentialResponse(credential),
        student: mapStudentResponse(credential.student),
      };
    }
    await logVerification(credentialId, RESULT.INVALID_SIGNATURE);
    return {
      result: RESULT.INVALID_SIGNATURE,
      credential: mapCredentialResponse(credential),
      student: null,
    };
  }

  if (credential.status === 'revoked') {
    await logVerification(credentialId, RESULT.REVOKED);
    return {
      result: RESULT.REVOKED,
      credential: mapCredentialResponse(credential),
      student: mapStudentResponse(credential.student),
    };
  }

  if (credential.status === 'expired' || new Date() > credential.expirationDate) {
    await logVerification(credentialId, RESULT.EXPIRED);
    return {
      result: RESULT.EXPIRED,
      credential: mapCredentialResponse(credential),
      student: mapStudentResponse(credential.student),
    };
  }

  const computedHash = createHash('sha256').update(jwtString).digest('hex');

  if (computedHash !== credential.credentialHash) {
    await logVerification(credentialId, RESULT.HASH_MISMATCH);
    return {
      result: RESULT.HASH_MISMATCH,
      credential: mapCredentialResponse(credential),
      student: null,
    };
  }

  let blockchainVerified = false;
  let blockchainAnchored = !!credential.blockchainTxHash;

  if (blockchain.isConfigured() && blockchainAnchored) {
    try {
      const onChainData = await blockchain.getCredentialFromChain(credentialId);

      if (onChainData && onChainData.issuedAt > 0) {
        if (onChainData.revoked) {
          await logVerification(credentialId, RESULT.REVOKED);
          return {
            result: RESULT.REVOKED,
            credential: mapCredentialResponse(credential),
            student: mapStudentResponse(credential.student),
            blockchainVerified: true,
            blockchainAnchored: true,
          };
        }

        if (onChainData.credentialHash !== computedHash) {
          await logVerification(credentialId, RESULT.HASH_MISMATCH);
          return {
            result: RESULT.HASH_MISMATCH,
            credential: mapCredentialResponse(credential),
            student: null,
            blockchainVerified: true,
            blockchainAnchored: true,
          };
        }

        blockchainVerified = true;
      }
    } catch (err) {
      console.error('Blockchain verification query failed:', err.message);
    }
  }

  if (!blockchainAnchored || !blockchainVerified) {
    await logVerification(credentialId, RESULT.VALID_UNANCHORED);
    return {
      result: RESULT.VALID_UNANCHORED,
      credential: mapCredentialResponse(credential),
      student: mapStudentResponse(credential.student),
      blockchainVerified: false,
      blockchainAnchored,
    };
  }

  await logVerification(credentialId, RESULT.VALID);
  return {
    result: RESULT.VALID,
    credential: mapCredentialResponse(credential),
    student: mapStudentResponse(credential.student),
    blockchainVerified: true,
    blockchainAnchored: true,
  };
}

function mapCredentialResponse(credential) {
  return {
    credentialId: credential.credentialId,
    issuanceDate: credential.issuanceDate,
    expirationDate: credential.expirationDate,
    status: credential.status,
    blockchainTxHash: credential.blockchainTxHash,
  };
}

function mapStudentResponse(student) {
  if (!student) return null;
  return {
    nim: student.nim,
    fullName: student.fullName,
    faculty: student.faculty,
    department: student.department,
    enrollmentYear: student.enrollmentYear,
    academicStatus: student.academicStatus,
    photoPath: student.photoPath,
  };
}

async function logVerification(credentialId, result, verifierInput) {
  try {
    await prisma.verificationLog.create({
      data: {
        credentialId,
        verifierInput: verifierInput || credentialId,
        result,
      },
    });
  } catch (err) {
    console.error('Failed to log verification:', err.message);
  }
}

module.exports = { verifyCredential, RESULT };
