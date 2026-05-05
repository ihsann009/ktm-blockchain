const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../src/config/database', () => ({
  student: { findUnique: jest.fn() },
  credential: { create: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn() },
  activityLog: { create: jest.fn() },
}));

jest.mock('../src/services/blockchain.service', () => ({
  isConfigured: jest.fn(() => false),
  anchorCredential: jest.fn(),
  revokeOnChain: jest.fn(),
  getCredentialFromChain: jest.fn(),
}));

jest.mock('../src/services/credential.service', () => {
  const actual = jest.requireActual('../src/services/credential.service');
  return actual;
});

const prisma = require('../src/config/database');
const app = require('../src/index');

function adminToken() {
  return jwt.sign(
    { userId: 'admin-uuid', role: 'admin', email: 'admin@test.com' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

function studentToken(userId) {
  return jwt.sign(
    { userId: userId || 'student-user-uuid', role: 'student', email: 'student@test.com' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

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
  user: { id: 'student-user-uuid', email: 'student@test.com' },
};

beforeEach(() => {
  jest.clearAllMocks();
  prisma.activityLog.create.mockResolvedValue({});
});

describe('POST /api/credentials/issue/:studentId', () => {
  it('issues credential for student (admin)', async () => {
    prisma.student.findUnique.mockResolvedValue(MOCK_STUDENT);
    prisma.credential.findFirst.mockResolvedValue(null);
    prisma.credential.create.mockImplementation(async ({ data }) => ({
      id: 'cred-db-uuid',
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      student: MOCK_STUDENT,
    }));

    const res = await request(app)
      .post('/api/credentials/issue/student-uuid-1')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(res.status).toBe(201);
    expect(res.body.data.credentialId).toBeDefined();
    expect(res.body.data.jwtToken).toBeDefined();
    expect(res.body.data.credentialHash).toMatch(/^[a-f0-9]{64}$/);
    expect(res.body.data.status).toBe('active');
  });

  it('returns 403 for non-admin', async () => {
    const res = await request(app)
      .post('/api/credentials/issue/student-uuid-1')
      .set('Authorization', `Bearer ${studentToken()}`);

    expect(res.status).toBe(403);
  });

  it('returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/credentials/issue/student-uuid-1');

    expect(res.status).toBe(401);
  });

  it('returns 404 for non-existent student', async () => {
    prisma.student.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/credentials/issue/nonexistent-id')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(res.status).toBe(404);
  });
});

describe('POST /api/credentials/revoke/:credentialId', () => {
  it('revokes credential (admin)', async () => {
    prisma.credential.findUnique.mockResolvedValue({
      id: 'cred-db-uuid',
      credentialId: 'cred-uuid-1',
      status: 'active',
      blockchainTxHash: null,
    });
    prisma.credential.update.mockResolvedValue({
      id: 'cred-db-uuid',
      credentialId: 'cred-uuid-1',
      status: 'revoked',
      student: MOCK_STUDENT,
    });

    const res = await request(app)
      .post('/api/credentials/revoke/cred-uuid-1')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('revoked');
  });

  it('returns 400 if already revoked', async () => {
    prisma.credential.findUnique.mockResolvedValue({
      id: 'cred-db-uuid',
      credentialId: 'cred-uuid-1',
      status: 'revoked',
    });

    const res = await request(app)
      .post('/api/credentials/revoke/cred-uuid-1')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(res.status).toBe(400);
  });

  it('returns 403 for non-admin', async () => {
    const res = await request(app)
      .post('/api/credentials/revoke/cred-uuid-1')
      .set('Authorization', `Bearer ${studentToken()}`);

    expect(res.status).toBe(403);
  });
});

describe('GET /api/credentials/:credentialId', () => {
  it('returns credential for admin', async () => {
    prisma.credential.findUnique.mockResolvedValue({
      id: 'cred-db-uuid',
      credentialId: 'cred-uuid-1',
      jwtToken: 'jwt-token-here',
      credentialHash: 'a'.repeat(64),
      issuanceDate: new Date(),
      expirationDate: new Date('2031-01-01'),
      status: 'active',
      blockchainTxHash: null,
      previousCredentialId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      student: MOCK_STUDENT,
    });

    const res = await request(app)
      .get('/api/credentials/cred-uuid-1')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data.credentialId).toBe('cred-uuid-1');
  });

  it('returns credential for owning student', async () => {
    prisma.credential.findUnique.mockResolvedValue({
      id: 'cred-db-uuid',
      credentialId: 'cred-uuid-1',
      jwtToken: 'jwt-token-here',
      credentialHash: 'a'.repeat(64),
      issuanceDate: new Date(),
      expirationDate: new Date('2031-01-01'),
      status: 'active',
      blockchainTxHash: null,
      previousCredentialId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      student: MOCK_STUDENT,
    });

    const res = await request(app)
      .get('/api/credentials/cred-uuid-1')
      .set('Authorization', `Bearer ${studentToken('student-user-uuid')}`);

    expect(res.status).toBe(200);
  });

  it('returns 403 for non-owning student', async () => {
    prisma.credential.findUnique.mockResolvedValue({
      id: 'cred-db-uuid',
      credentialId: 'cred-uuid-1',
      student: { ...MOCK_STUDENT, userId: 'other-user-uuid' },
    });

    const res = await request(app)
      .get('/api/credentials/cred-uuid-1')
      .set('Authorization', `Bearer ${studentToken('different-user-uuid')}`);

    expect(res.status).toBe(403);
  });

  it('returns 404 for non-existent credential', async () => {
    prisma.credential.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/credentials/nonexistent')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(res.status).toBe(404);
  });
});
