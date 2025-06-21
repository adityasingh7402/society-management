import connectToDatabase from "../../../lib/mongodb";
import GuestPass from "../../../models/GuestPass";
import QRCodeStyling from "qr-code-styling";
import { nanoid } from 'nanoid';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await connectToDatabase();

    const {
      residentId,
      societyId,
      guestDetails,
      validFrom,
      validUntil,
      vehicleDetails
    } = req.body;

    console.log(req.body.residentId, req.body.societyId, req.body.guestDetails, req.body.validFrom, req.body.validUntil, req.body.vehicleDetails);
    // Validate required fields
    if (!residentId || !societyId || !guestDetails || !validFrom || !validUntil) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Generate a unique identifier for the pass
    const passId = nanoid(10);

    // Create QR code data
    const qrData = JSON.stringify({
      passId,
      type: 'guest',
      guestName: guestDetails.name,
      validFrom,
      validUntil,
      vehicleNumber: vehicleDetails?.vehicleNumber
    });

    // Generate QR code with custom styling
    const qrCode = new QRCodeStyling({
      width: 400,
      height: 400,
      data: qrData,
      dotsOptions: {
        color: "#4A90E2",
        type: "rounded"
      },
      backgroundOptions: {
        color: "#ffffff"
      },
      cornersSquareOptions: {
        color: "#4A90E2",
        type: "extra-rounded"
      },
      gradient: {
        type: "linear",
        rotation: 0,
        colorStops: [
          { offset: 0, color: "#6a11cb" },
          { offset: 1, color: "#2575fc" }
        ]
      }
    });

    // Convert QR code to data URL
    const canvas = await qrCode.getCanvas();
    const qrCodeImage = canvas.toDataURL();

    // Create new guest pass
    const guestPass = new GuestPass({
      residentId,
      societyId,
      guestDetails,
      validFrom: new Date(validFrom),
      validUntil: new Date(validUntil),
      vehicleDetails,
      qrCode: qrCodeImage
    });

    await guestPass.save();

    res.status(201).json({
      message: 'Guest pass created successfully',
      data: guestPass
    });

  } catch (error) {
    console.error('Error creating guest pass:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 