// pages/api/society.js
import cloudinary from '../../lib/cloudinary';
import firebase from '../../lib/firebase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const {
    societyName,
    societyType,
    managerName,
    managerPhone,
    managerEmail,
    societyAddress,
    zipCode,
    description,
    otp,
    societyImages,
  } = req.body;

  try {
    // Upload image to Cloudinary
    const uploadResponse = await cloudinary.v2.uploader.upload(societyImages[0], {
      folder: 'society_images',
    });

    const imageUrl = uploadResponse.secure_url;

    // Save data to Firestore
    const db = firebase.firestore();
    const societyRef = db.collection('societies').doc();
    await societyRef.set({
      societyName,
      societyType,
      managerName,
      managerPhone,
      managerEmail,
      societyAddress,
      zipCode,
      description,
      otp,
      societyImage: imageUrl,
    });

    res.status(200).json({ success: true, message: 'Society data saved successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error saving society data', error: error.message });
  }
}
