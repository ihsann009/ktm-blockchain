const request = require('supertest');
const { createHash, createECDH } = require('crypto');
const { SignJWT, importJWK } = require('jose');

jest.mock('../src/config/database', () => ({
  credential: { findUnique: jest.fn() },
  verificationLog: { create: jest.fn() },
  user: { findUnique: jest.fn() },
  student: { findUnique: jest.fn() },
  activityLog: { create: jest.fn() },
}));

jest.mock('../src/services/blockchain.service', () => ({
  isConfigured: jest.fn(() => false),
  anchorCredential: jest.fn(),
  revokeOnChain: jest.fn(),
  getCredentialFromChain: jest.fn(),
}));

const prisma = require('../src/config/database');
const blockchain = require('../src/services/blockchain.service');
const app = require('../src/index');

const TEST_PRIVATE_KEY_HEX = process.env.ISSUER_PRIVATE_KEY;

const MOCK_STUDENT = {
  id: 'student-uuid-1',
  userId: 'student-user-uuid',
  nim: '20240001',
  fullName: 'Ahmad Fauzi',
  faculty: 'Ilmu Komputer',
  department: 'Teknik Informatika',
  enrollmentYear: 2024,
  academicStatus: 'active',
  photoPath: null,
};

function toBase64Url(buffer) {
  return buffer.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function buildPrivateKey(hexKey) {
  const privateKeyBytes = Buffer.from(hexKey, 'hex');
  const ecdh = createECDH('secp256k1');
  ecdh.setPrivateKey(privateKeyBytes);
  const publicKey = ecdh.getPublicKey(undefined, 'uncompressed');
  const x = publicKey.subarray(1, 33);
  const y = publicKey.subarray(33, 65);

  const jwk = {
    kty: 'EC',
    crv: 'secp256k1',
    d: toBase64Url(privateKeyBytes),
    x: toBase64Url(x),
    y: toBase64Url(y),
  };

  return importJWK(jwk, 'ES256K');
}

async function generateTestJwt(credentialId, options = {}) {
  const keyHex = options.privateKeyHex || TEST_PRIVATE_KEY_HEX;
  const privateKey = await buildPrivateKey(keyHex);

  const expSeconds = options.expired
    ? Math.floor(Date.now() / 1000) - 3600
    : Math.floor(Date.now() / 1000) + 86400 * 365 * 7;

  const jwtToken = await new SignJWT({
    vc: {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential', 'StudentIdentityCredential'],
      credentialSubject: {
        nim: '20240001',
        fullName: 'Ahmad Fauzi',
        faculty: 'Ilmu Komputer',
        department: 'Teknik Informatika',
        enrollmentYear: 2024,
        academicStatus: 'active',
        photoHash: null,
      },
    },
  })
    .setProtectedHeader({ alg: 'ES256K', typ: 'JWT' })
    .setIssuer(process.env.ISSUER_URL)
    .setSubject('20240001')
    .setIssuedAt()
    .setExpirationTime(expSeconds)
    .setJti(credentialId)
    .sign(privateKey);

  return jwtToken;
}

function computeHash(jwtString) {
  return createHash('sha256').update(jwtString).digest('hex');
}

beforeEach(() => {
  jest.clearAllMocks();
  prisma.verificationLog.create.mockResolvedValue({});
  blockchain.isConfigured.mockReturnValue(false);
});

describe('POST /api/verify', () => {
  it('returns valid for a properly signed credential', async () => {
    const credentialId = 'valid-cred-uuid';
    const jwtToken = await generateTestJwt(credentialId);
    const credentialHash = computeHash(jwtToken);

    prisma.credential.findUnique.mockResolvedValue({
      credentialId,
      jwtToken,
      credentialHash,
      issuanceDate: new Date(),
      expirationDate: new Date('2031-01-01'),
      status: 'active',
      blockchainTxHash: '0xabc123',
      student: MOCK_STUDENT,
    });

    const res = await request(app)
      .post('/api/verify')
      .send({ credentialId });

    expect(res.status).toBe(200);
    expect(res.body.result).toBe('valid_unanchored');
    expect(res.body.blockchainAnchored).toBe(true);
    expect(res.body.blockchainVerified).toBe(false);
    expect(res.body.student.nim).toBe('20240001');
    expect(res.body.credential.credentialId).toBe(credentialId);
  });

  it('returns not_found for non-existent credentialId', async () => {
    prisma.credential.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/verify')
      .send({ credentialId: 'nonexistent-uuid' });

    expect(res.status).toBe(200);
    expect(res.body.result).toBe('not_found');
    expect(res.body.credential).toBeNull();
  });

  it('returns revoked for revoked credential', async () => {
    const credentialId = 'revoked-cred-uuid';
    const jwtToken = await generateTestJwt(credentialId);
    const credentialHash = computeHash(jwtToken);

    prisma.credential.findUnique.mockResolvedValue({
      credentialId,
      jwtToken,
      credentialHash,
      issuanceDate: new Date(),
      expirationDate: new Date('2031-01-01'),
      status: 'revoked',
      blockchainTxHash: '0xabc123',
      student: MOCK_STUDENT,
    });

    const res = await request(app)
      .post('/api/verify')
      .send({ credentialId });

    expect(res.status).toBe(200);
    expect(res.body.result).toBe('revoked');
  });

  it('returns expired for expired credential', async () => {
    const credentialId = 'expired-cred-uuid';
    const jwtToken = await generateTestJwt(credentialId, { expired: true });
    const credentialHash = computeHash(jwtToken);

    prisma.credential.findUnique.mockResolvedValue({
      credentialId,
      jwtToken,
      credentialHash,
      issuanceDate: new Date('2020-01-01'),
      expirationDate: new Date('2020-06-01'),
      status: 'active',
      blockchainTxHash: null,
      student: MOCK_STUDENT,
    });

    const res = await request(app)
      .post('/api/verify')
      .send({ credentialId });

    expect(res.status).toBe(200);
    expect(res.body.result).toBe('expired');
  });

  it('returns hash_mismatch when stored hash differs from computed', async () => {
    const credentialId = 'tampered-cred-uuid';
    const jwtToken = await generateTestJwt(credentialId);

    prisma.credential.findUnique.mockResolvedValue({
      credentialId,
      jwtToken,
      credentialHash: 'f'.repeat(64),
      issuanceDate: new Date(),
      expirationDate: new Date('2031-01-01'),
      status: 'active',
      blockchainTxHash: null,
      student: MOCK_STUDENT,
    });

    const res = await request(app)
      .post('/api/verify')
      .send({ credentialId });

    expect(res.status).toBe(200);
    expect(res.body.result).toBe('hash_mismatch');
  });

  it('returns invalid_signature when JWT signed with different key', async () => {
    const credentialId = 'badsig-cred-uuid';
    const differentKey = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2';
    const jwtToken = await generateTestJwt(credentialId, { privateKeyHex: differentKey });
    const credentialHash = computeHash(jwtToken);

    prisma.credential.findUnique.mockResolvedValue({
      credentialId,
      jwtToken,
      credentialHash,
      issuanceDate: new Date(),
      expirationDate: new Date('2031-01-01'),
      status: 'active',
      blockchainTxHash: null,
      student: MOCK_STUDENT,
    });

    const res = await request(app)
      .post('/api/verify')
      .send({ credentialId });

    expect(res.status).toBe(200);
    expect(res.body.result).toBe('invalid_signature');
  });

  it('returns 400 when credentialId is missing', async () => {
    const res = await request(app)
      .post('/api/verify')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('checks blockchain when configured and returns revoked', async () => {
    const credentialId = 'chain-revoked-uuid';
    const jwtToken = await generateTestJwt(credentialId);
    const credentialHash = computeHash(jwtToken);

    prisma.credential.findUnique.mockResolvedValue({
      credentialId,
      jwtToken,
      credentialHash,
      issuanceDate: new Date(),
      expirationDate: new Date('2031-01-01'),
      status: 'active',
      blockchainTxHash: '0xabc',
      student: MOCK_STUDENT,
    });

    blockchain.isConfigured.mockReturnValue(true);
    blockchain.getCredentialFromChain.mockResolvedValue({
      credentialHash,
      issuedAt: Math.floor(Date.now() / 1000),
      expiresAt: Math.floor(new Date('2031-01-01').getTime() / 1000),
      revoked: true,
    });

    const res = await request(app)
      .post('/api/verify')
      .send({ credentialId });

    expect(res.status).toBe(200);
    expect(res.body.result).toBe('revoked');
  });

  it('checks blockchain hash mismatch', async () => {
    const credentialId = 'chain-mismatch-uuid';
    const jwtToken = await generateTestJwt(credentialId);
    const credentialHash = computeHash(jwtToken);

    prisma.credential.findUnique.mockResolvedValue({
      credentialId,
      jwtToken,
      credentialHash,
      issuanceDate: new Date(),
      expirationDate: new Date('2031-01-01'),
      status: 'active',
      blockchainTxHash: '0xabc',
      student: MOCK_STUDENT,
    });

    blockchain.isConfigured.mockReturnValue(true);
    blockchain.getCredentialFromChain.mockResolvedValue({
      credentialHash: 'b'.repeat(64),
      issuedAt: Math.floor(Date.now() / 1000),
      expiresAt: Math.floor(new Date('2031-01-01').getTime() / 1000),
      revoked: false,
    });

    const res = await request(app)
      .post('/api/verify')
      .send({ credentialId });

    expect(res.status).toBe(200);
    expect(res.body.result).toBe('hash_mismatch');
  });
});

describe('GET /api/verify/:credentialId', () => {
  it('returns valid for a properly signed credential', async () => {
    const credentialId = 'get-valid-uuid';
    const jwtToken = await generateTestJwt(credentialId);
    const credentialHash = computeHash(jwtToken);

    prisma.credential.findUnique.mockResolvedValue({
      credentialId,
      jwtToken,
      credentialHash,
      issuanceDate: new Date(),
      expirationDate: new Date('2031-01-01'),
      status: 'active',
      blockchainTxHash: null,
      student: MOCK_STUDENT,
    });

    const res = await request(app)
      .get(`/api/verify/${credentialId}`);

    expect(res.status).toBe(200);
    expect(res.body.result).toBe('valid_unanchored');
  });

  it('returns not_found for non-existent credentialId', async () => {
    prisma.credential.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/verify/nonexistent-uuid');

    expect(res.status).toBe(200);
    expect(res.body.result).toBe('not_found');
  });
});
