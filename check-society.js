const mongoose = require('mongoose');

const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;
  try {
    // Use the MongoDB URI from environment
    const uri = process.env.MONGODB_URI || 'mongodb+srv://adityasingh7402:akhil1981@society-managt.qk5sl.mongodb.net/';
    await mongoose.connect(uri);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Import the Society model
const Society = require('./models/Society').default;

async function checkSociety() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');
    
    const societyId = '67e10976c6c0a55cab729399';
    console.log('Searching for society with _id:', societyId);
    
    // Search by MongoDB _id
    const societyById = await Society.findById(societyId);
    console.log('Society found by _id:', societyById ? 'YES' : 'NO');
    if (societyById) {
      console.log('Society data:', {
        _id: societyById._id,
        societyId: societyById.societyId,
        societyName: societyById.societyName,
        managerName: societyById.managerName
      });
    }
    
    // Search by societyId field
    const societyBySocietyId = await Society.findOne({ societyId: societyId });
    console.log('Society found by societyId field:', societyBySocietyId ? 'YES' : 'NO');
    if (societyBySocietyId) {
      console.log('Society data:', {
        _id: societyBySocietyId._id,
        societyId: societyBySocietyId.societyId,
        societyName: societyBySocietyId.societyName
      });
    }
    
    // Also try with '340714' (from JWT)
    const societyBy340714 = await Society.findOne({ societyId: '340714' });
    console.log('Society found by societyId 340714:', societyBy340714 ? 'YES' : 'NO');
    if (societyBy340714) {
      console.log('Society data:', {
        _id: societyBy340714._id,
        societyId: societyBy340714.societyId,
        societyName: societyBy340714.societyName
      });
    }

    // List all societies to see what's there
    const allSocieties = await Society.find({}).select('_id societyId societyName managerName').limit(5);
    console.log('\nAll societies in database:');
    allSocieties.forEach(society => {
      console.log({
        _id: society._id,
        societyId: society.societyId,
        societyName: society.societyName,
        managerName: society.managerName
      });
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

checkSociety();
