import connectToDatabase from '../../../lib/mongodb';
import Visitor from '../../../models/Visitor';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const {
        societyId,
        blockName,
        floorNumber,
        flatNumber,
        residentId,
        ownerName,
        ownerMobile,
        ownerEmail,
        visitorName,
        visitorReason,
        entryTime,
        exitTime,
        CreatedBy
      } = req.body;

      // Validate required fields
      if (!societyId || !blockName || !flatNumber || !residentId || !visitorName || !entryTime) {
        return res.status(400).json({ 
          success: false,
          error: 'Missing required fields' 
        });
      }

      // Connect to the database
      await connectToDatabase();

      // Create a new visitor record
      const newVisitor = new Visitor({
        societyId,
        blockName,
        floorNumber,
        flatNumber,
        residentId,
        ownerName,
        ownerMobile,
        ownerEmail,
        visitorName,
        visitorReason,
        entryTime: new Date(entryTime),
        exitTime: exitTime ? new Date(exitTime) : null,
        CreatedBy,
        createdAt: new Date(),
        status: 'active'
      });

      // Save the new visitor
      const savedVisitor = await newVisitor.save();

      res.status(201).json({
        success: true,
        message: 'Visitor entry created successfully',
        _id: savedVisitor._id,
        visitorName: savedVisitor.visitorName
      });
    } catch (error) {
      console.error('Error creating visitor entry:', error);
      res.status(500).json({ 
        success: false,
        error: 'Internal server error', 
        details: error.message 
      });
    }
  } else {
    res.status(405).json({ 
      success: false,
      error: 'Method Not Allowed'  
    });
  }
}