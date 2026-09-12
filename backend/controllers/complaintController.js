const prisma = require('../lib/prisma');
const crypto = require('crypto');

const generateComplaintId = async () => {
  const year = new Date().getFullYear();
  let complaintId;
  do {
    const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    complaintId = `PAR-${year}-${suffix}`;
  } while (await prisma.complaint.findUnique({ where: { complaintId } }));
  return complaintId;
};

const addHistoryEntry = async (complaintId, status, message, updatedBy = 'System') => {
  await prisma.complaintHistory.create({
    data: {
      complaintId,
      status,
      message,
      updatedBy,
    },
  });
};

const normalizeComplaint = (complaint) => ({
  ...complaint,
  history: complaint.history || [],
});

const findComplaintByReference = (reference) => {
  const numericId = Number(reference);
  return Number.isInteger(numericId) && String(numericId) === reference
    ? prisma.complaint.findUnique({ where: { id: numericId } })
    : prisma.complaint.findUnique({ where: { complaintId: reference } });
};

const normalizeStatus = (status) => {
  const values = {
    SUBMITTED: 'Submitted',
    'UNDER REVIEW': 'Under Review',
    'IN PROGRESS': 'In Progress',
    RESOLVED: 'Resolved',
    CLOSED: 'Closed',
    ESCALATED: 'Escalated',
  };
  return values[String(status || '').trim().toUpperCase()];
};

const submitComplaint = async (req, res) => {
  try {
    const { title, category, description, college, collegeId, priority, location, additionalEvidence } = req.body;

    if (!title?.trim() || !category?.trim() || !description?.trim() || !college?.trim() || !collegeId?.trim()) {
      return res.status(400).json({ success: false, message: 'Title, category, description, college and college ID are required' });
    }

    if (description.trim().length < 30) {
      return res.status(400).json({ success: false, message: 'Description must be at least 30 characters' });
    }

    const student = await prisma.user.findUnique({ where: { id: Number(req.user.id) } });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const complaintId = await generateComplaintId();
    const imagePath = req.file ? `/uploads/${req.file.filename}` : '';

    const complaint = await prisma.complaint.create({
      data: {
        complaintId,
        studentId: student.id,
        studentName: student.name,
        college,
        collegeCode: collegeId.trim(),
        category,
        title,
        description: additionalEvidence?.trim()
          ? `${description.trim()}\n\nAdditional evidence:\n${additionalEvidence.trim()}`
          : description.trim(),
        location: location || '',
        image: imagePath,
        priority: priority || 'Medium',
        status: 'Submitted',
        history: {
          create: [{
            status: 'Submitted',
            message: 'Complaint submitted successfully',
            updatedBy: student.name,
          }],
        },
      },
      include: { history: true },
    });

    return res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      complaintId: complaint.complaintId,
      data: normalizeComplaint(complaint),
    });
  } catch (error) {
    console.error('Submit complaint error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Unable to submit complaint' });
  }
};

const getMyComplaints = async (req, res) => {
  try {
    const complaints = await prisma.complaint.findMany({
      where: { studentId: Number(req.user.id) },
      orderBy: { createdAt: 'desc' },
      include: { history: true },
    });

    return res.json({ success: true, data: complaints.map(normalizeComplaint) });
  } catch (error) {
    console.error('My complaints error:', error);
    return res.status(500).json({ success: false, message: 'Unable to fetch your complaints' });
  }
};

const getComplaintById = async (req, res) => {
  try {
    const reference = req.params.id;
    const complaint = await prisma.complaint.findFirst({
      where: Number.isInteger(Number(reference))
        ? { id: Number(reference) }
        : { complaintId: reference },
      include: { history: true },
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    if (req.user.role === 'STUDENT' && complaint.studentId !== Number(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    return res.json({ success: true, data: normalizeComplaint(complaint) });
  } catch (error) {
    console.error('Get complaint error:', error);
    return res.status(500).json({ success: false, message: 'Unable to fetch complaint' });
  }
};

const trackComplaintById = async (req, res) => {
  try {
    const complaint = await prisma.complaint.findUnique({
      where: { complaintId: req.params.complaintId },
      include: { history: true },
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint ID not found' });
    }

    if (req.user && req.user.role === 'STUDENT' && complaint.studentId !== Number(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    return res.json({ success: true, data: normalizeComplaint(complaint) });
  } catch (error) {
    console.error('Track complaint error:', error);
    return res.status(500).json({ success: false, message: 'Unable to track complaint' });
  }
};

const getAllComplaints = async (req, res) => {
  try {
    const { status, category, college, priority, q } = req.query;
    const filters = {};

    if (status) filters.status = status;
    if (category) filters.category = category;
    if (college) filters.college = college;
    if (priority) filters.priority = priority;

    if (q) {
      filters.OR = [
        { complaintId: { contains: q } },
        { studentName: { contains: q } },
        { title: { contains: q } },
      ];
    }

    const complaints = await prisma.complaint.findMany({
      where: filters,
      orderBy: { createdAt: 'desc' },
      include: { history: true },
    });

    return res.json({ success: true, data: complaints.map(normalizeComplaint) });
  } catch (error) {
    console.error('Get all complaints error:', error);
    return res.status(500).json({ success: false, message: 'Unable to fetch complaints' });
  }
};

const updateComplaintStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const normalizedStatus = normalizeStatus(status);
    if (!normalizedStatus) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const complaint = await findComplaintByReference(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const resolution = typeof note === 'string' && note.trim()
      ? note.trim()
      : normalizedStatus === 'Resolved' ? complaint.resolution : null;
    const updated = await prisma.complaint.update({
      where: { id: complaint.id },
      data: {
        status: normalizedStatus,
        resolution,
        resolvedAt: normalizedStatus === 'Resolved' ? (complaint.resolvedAt || new Date()) : null,
        history: {
          create: [{
            status: normalizedStatus,
            message: note?.trim() || `Status changed to ${normalizedStatus} by ${req.user.name}`,
            updatedBy: req.user.name,
          }],
        },
      },
      include: { history: true },
    });

    return res.json({ success: true, message: 'Complaint status updated', data: normalizeComplaint(updated) });
  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({ success: false, message: 'Unable to update complaint status' });
  }
};

const assignComplaint = async (req, res) => {
  try {
    const { assignedTo } = req.body;
    if (!assignedTo) {
      return res.status(400).json({ success: false, message: 'assignedTo is required' });
    }

    const complaint = await findComplaintByReference(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const updated = await prisma.complaint.update({
      where: { id: complaint.id },
      data: {
        assignedTo,
        status: complaint.status || 'Under Review',
        updatedAt: new Date(),
        history: {
          create: [{
            status: complaint.status || 'Under Review',
            message: `Complaint assigned to ${assignedTo}`,
            updatedBy: req.user.name,
          }],
        },
      },
      include: { history: true },
    });

    return res.json({ success: true, message: 'Complaint assigned successfully', data: normalizeComplaint(updated) });
  } catch (error) {
    console.error('Assign complaint error:', error);
    return res.status(500).json({ success: false, message: 'Unable to assign complaint' });
  }
};

const resolveComplaint = async (req, res) => {
  try {
    const { resolution } = req.body;
    if (!resolution) {
      return res.status(400).json({ success: false, message: 'Resolution is required' });
    }

    const complaint = await findComplaintByReference(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const updated = await prisma.complaint.update({
      where: { id: complaint.id },
      data: {
        resolution,
        status: 'Resolved',
        resolvedAt: new Date(),
        updatedAt: new Date(),
        history: {
          create: [{
            status: 'Resolved',
            message: resolution,
            updatedBy: req.user.name,
          }],
        },
      },
      include: { history: true },
    });

    return res.json({ success: true, message: 'Complaint resolved successfully', data: normalizeComplaint(updated) });
  } catch (error) {
    console.error('Resolve complaint error:', error);
    return res.status(500).json({ success: false, message: 'Unable to resolve complaint' });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const collegeFilter = req.user.role === 'ADMIN' && req.user.collegeCode
      ? { collegeCode: req.user.collegeCode }
      : {};
    const totalComplaints = await prisma.complaint.count({ where: collegeFilter });
    const submitted = await prisma.complaint.count({ where: { ...collegeFilter, status: 'Submitted' } });
    const underReview = await prisma.complaint.count({ where: { ...collegeFilter, status: 'Under Review' } });
    const inProgress = await prisma.complaint.count({ where: { ...collegeFilter, status: 'In Progress' } });
    const resolved = await prisma.complaint.count({ where: { ...collegeFilter, status: 'Resolved' } });

    const categoryWise = await prisma.complaint.groupBy({
      by: ['category'],
      where: collegeFilter,
      _count: { category: true },
      orderBy: { _count: { category: 'desc' } },
    });

    const collegeWise = await prisma.complaint.groupBy({
      by: ['college'],
      where: collegeFilter,
      _count: { college: true },
      orderBy: { _count: { college: 'desc' } },
    });

    const monthlyComplaints = req.user.role === 'ADMIN' && req.user.collegeCode
      ? await prisma.$queryRaw`
          SELECT strftime('%Y-%m', createdAt) AS month, COUNT(*) AS count
          FROM "Complaint"
          WHERE collegeCode = ${req.user.collegeCode}
          GROUP BY strftime('%Y-%m', createdAt)
          ORDER BY month ASC
        `
      : await prisma.$queryRaw`
          SELECT strftime('%Y-%m', createdAt) AS month, COUNT(*) AS count
          FROM "Complaint"
          GROUP BY strftime('%Y-%m', createdAt)
          ORDER BY month ASC
        `;

    return res.json({
      success: true,
      data: {
        totalComplaints,
        submitted,
        underReview,
        inProgress,
        resolved,
        unresolved: totalComplaints - resolved,
        categoryWise: categoryWise.map((item) => ({ _id: item.category, count: item._count.category })),
        collegeWise: collegeWise.map((item) => ({ _id: item.college, count: item._count.college })),
        monthlyComplaints: monthlyComplaints.map((item) => ({
          month: item.month,
          count: Number(item.count),
        })),
        pendingComplaints: submitted + underReview + inProgress,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return res.status(500).json({ success: false, message: 'Unable to fetch dashboard statistics' });
  }
};

module.exports = {
  submitComplaint,
  getMyComplaints,
  getComplaintById,
  trackComplaintById,
  getAllComplaints,
  updateComplaintStatus,
  assignComplaint,
  resolveComplaint,
  getDashboardStats,
};
