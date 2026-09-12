const bcrypt = require('bcrypt');
const prisma = require('../lib/prisma');

async function seed() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const studentPassword = await bcrypt.hash('student123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@ihrd.ac.in' },
    update: {},
    create: {
      name: 'College Admin',
      email: 'admin@ihrd.ac.in',
      password: adminPassword,
      college: 'College of Engineering Kallooppara',
      collegeCode: 'CEK',
      role: 'ADMIN',
    },
  });

  await prisma.user.upsert({
    where: { email: 'central@ihrd.ac.in' },
    update: {},
    create: {
      name: 'Central Admin',
      email: 'central@ihrd.ac.in',
      password: adminPassword,
      college: 'IHRD Central',
      collegeCode: 'HQ',
      role: 'CENTRAL_ADMIN',
    },
  });

  await prisma.user.upsert({
    where: { email: 'student@ihrd.ac.in' },
    update: {},
    create: {
      name: 'Student User',
      email: 'student@ihrd.ac.in',
      password: studentPassword,
      college: 'College of Engineering Kallooppara',
      collegeCode: 'CEK',
      role: 'STUDENT',
    },
  });

  await prisma.college.upsert({
    where: { code: 'CEK' },
    update: {},
    create: {
      name: 'College of Engineering Kallooppara',
      location: 'Kallooppara, Pathanamthitta',
      code: 'CEK',
    },
  });

  console.log('Seed data completed');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
