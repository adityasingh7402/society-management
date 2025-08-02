// In your /api/Message-Api/sendMessage.js file, add discussionId support:

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    const { societyCode, senderId, senderName, content, isSociety, discussionId } = req.body;

    const message = new Message({
      societyId: societyCode,
      senderId,
      senderName,
      content,
      isSociety: isSociety || false,
      discussionId: discussionId || null, // Add discussionId field
      timestamp: new Date(),
      isDeleted: false
    });

    await message.save();
    res.status(201).json({ success: true, message });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
}