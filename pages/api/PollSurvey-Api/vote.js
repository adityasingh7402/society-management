import PollSurvey from '../../../models/PollSurvey';
import connectDB from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    const { pollId, optionId, userId } = req.body;

    if (!pollId || !optionId || !userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Poll ID, option ID, and user ID are required' 
      });
    }

    // Find the poll
    const poll = await PollSurvey.findOne({ 
      _id: pollId, 
      type: 'poll', 
      status: 'active' 
    });
    
    if (!poll) {
      return res.status(404).json({ 
        success: false, 
        message: 'Poll not found or not active' 
      });
    }

    // Check if user already voted
    const alreadyVoted = poll.participants.some(p => 
      p.userId.toString() === userId.toString()
    );
    
    if (alreadyVoted) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have already voted in this poll' 
      });
    }

    // Update the poll with the vote
    const updatedPoll = await PollSurvey.findByIdAndUpdate(
      pollId,
      {
        $push: { participants: { userId, votedOption: optionId } },
        $inc: { [`options.$[elem].votes`]: 1 }
      },
      {
        arrayFilters: [{ "elem.id": optionId }],
        new: true
      }
    );

    res.status(200).json({ success: true, data: updatedPoll });
  } catch (error) {
    console.error('Error voting in poll:', error);
    res.status(500).json({ message: 'Failed to vote in poll', error: error.message });
  }
}