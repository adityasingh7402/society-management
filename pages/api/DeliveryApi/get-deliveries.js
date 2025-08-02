import connectDB from '../../../lib/mongodb';
import Delivery from '../../../models/Delivery';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    // Extract query parameters
    const {
      societyId,
      status,
      deliveryCompany,
      deliveryType,
      flatNumber,
      blockName,
      startDate,
      endDate,
      recipientId,
      page = 1,
      limit = 20,
      sortBy = 'receivedTime',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { status: 'Delivered' };

    if (societyId) {
      filter.societyId = societyId;
    }

    if (deliveryCompany) {
      filter.deliveryCompany = deliveryCompany;
    }

    if (deliveryType) {
      filter.deliveryType = deliveryType;
    }

    if (flatNumber) {
      filter.flatNumber = flatNumber;
    }

    if (blockName) {
      filter.blockName = blockName;
    }

    if (recipientId) {
      filter.recipientId = recipientId;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.receivedTime = {};
      if (startDate) {
        filter.receivedTime.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.receivedTime.$lte = new Date(endDate);
      }
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const [deliveries, totalCount] = await Promise.all([
      Delivery.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate('recipientId', 'name email phone')
        .populate('securityId', 'guardName guardPhone')
        .lean(),
      Delivery.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.status(200).json({
      success: true,
      deliveries,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        limit: limitNum,
        hasNextPage,
        hasPrevPage
      },
      filter: filter,
      sort: sort
    });

  } catch (error) {
    console.error('Error fetching deliveries:', error);
    res.status(500).json({ 
      error: 'Failed to fetch deliveries',
      details: error.message 
    });
  }
}
