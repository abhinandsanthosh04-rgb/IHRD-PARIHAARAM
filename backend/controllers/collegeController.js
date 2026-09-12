const prisma = require('../lib/prisma');

const getColleges = async (req, res) => {
  try {
    const colleges = await prisma.college.findMany({
      orderBy: { name: 'asc' },
    });
    return res.json({ success: true, data: colleges });
  } catch (error) {
    console.error('Get colleges error:', error);
    return res.status(500).json({ success: false, message: 'Unable to fetch colleges' });
  }
};

const createCollege = async (req, res) => {
  try {
    const { name, location, code } = req.body;

    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'College name and code are required' });
    }

    const existing = await prisma.college.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'College with this code already exists' });
    }

    const college = await prisma.college.create({
      data: {
        name,
        location,
        code: code.toUpperCase(),
      },
    });

    return res.status(201).json({ success: true, message: 'College created successfully', data: college });
  } catch (error) {
    console.error('Create college error:', error);
    return res.status(500).json({ success: false, message: 'Unable to create college' });
  }
};

module.exports = {
  getColleges,
  createCollege,
};
