const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminHash = await bcrypt.hash('admin123', 10);
  const studentHash = await bcrypt.hash('student123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@kampus.ac.id' },
    update: {},
    create: {
      email: 'admin@kampus.ac.id',
      passwordHash: adminHash,
      role: 'admin',
    },
  });

  const studentUser = await prisma.user.upsert({
    where: { email: 'ahmad.fauzi@student.kampus.ac.id' },
    update: {},
    create: {
      email: 'ahmad.fauzi@student.kampus.ac.id',
      passwordHash: studentHash,
      role: 'student',
    },
  });

  await prisma.student.upsert({
    where: { nim: '20240001' },
    update: {},
    create: {
      userId: studentUser.id,
      nim: '20240001',
      fullName: 'Ahmad Fauzi',
      faculty: 'Ilmu Komputer',
      department: 'Teknik Informatika',
      enrollmentYear: 2024,
      academicStatus: 'active',
    },
  });

  const verifierHash = await bcrypt.hash('verifier123', 10);
  await prisma.user.upsert({
    where: { email: 'verifier@kampus.ac.id' },
    update: {},
    create: {
      email: 'verifier@kampus.ac.id',
      passwordHash: verifierHash,
      role: 'verifier',
    },
  });

  console.log('Seed complete:');
  console.log('  Admin: admin@kampus.ac.id / admin123');
  console.log('  Student: ahmad.fauzi@student.kampus.ac.id (NIM: 20240001) / student123');
  console.log('  Verifier: verifier@kampus.ac.id / verifier123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
