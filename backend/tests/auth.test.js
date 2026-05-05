const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

jest.mock('../src/config/database', () => ({
  user: { findUnique: jest.fn() },
  student: { findUnique: jest.fn() },
  activityLog: { create: jest.fn() },
}));

const prisma = require('../src/config/database');
const app = require('../src/index');

const TEST_USER = {
  id: 'user-uuid-1',
  email: 'admin@test.com',
  passwordHash: bcrypt.hashSync('password123', 10),
  role: 'admin',
  student: null,
};

const TEST_STUDENT_USER = {
  id: 'user-uuid-2',
  email: 'student@test.com',
  passwordHash: bcrypt.hashSync('password123', 10),
  role: 'student',
  student: {
    id: 'student-uuid-1',
    nim: '20240001',
    fullName: 'Ahmad Fauzi',
    faculty: 'Ilmu Komputer',
    department: 'Teknik Informatika',
    enrollmentYear: 2024,
    academicStatus: 'active',
    photoPath: null,
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  prisma.activityLog.create.mockResolvedValue({});
});

describe('POST /api/auth/login', () => {
  it('returns token when logging in with email', async () => {
    prisma.user.findUnique.mockResolvedValue(TEST_USER);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('admin@test.com');
    expect(res.body.user.role).toBe('admin');
  });

  it('returns token when logging in with NIM', async () => {
    prisma.student.findUnique.mockResolvedValue({
      ...TEST_STUDENT_USER.student,
      user: {
        id: TEST_STUDENT_USER.id,
        email: TEST_STUDENT_USER.email,
        passwordHash: TEST_STUDENT_USER.passwordHash,
        role: TEST_STUDENT_USER.role,
      },
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ nim: '20240001', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('student');
  });

  it('returns 401 with wrong password', async () => {
    prisma.user.findUnique.mockResolvedValue(TEST_USER);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('returns 400 when fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});

    expect(res.status).toBe(400);
  });

  it('returns 401 when user not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'password123' });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('returns user data with valid token', async () => {
    const token = jwt.sign(
      { userId: TEST_USER.id, role: 'admin', email: TEST_USER.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    prisma.user.findUnique.mockResolvedValue(TEST_USER);

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('admin@test.com');
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
  });

  it('returns 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid-token-here');

    expect(res.status).toBe(401);
  });
});
