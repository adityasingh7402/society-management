import { createCanvas, loadImage } from 'canvas';
import QRCode from 'qrcode';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { qrData, vehicleDetails } = req.body;

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
      width: 800,
      margin: 1,
      color: {
        dark: '#1A75FF',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });

    // Create canvas for shareable image
    const canvas = createCanvas(1200, 1600);
    const ctx = canvas.getContext('2d');

    // Set background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1200, 1600);

    // Load and draw QR code
    const qrImage = await loadImage(qrCodeDataUrl);
    ctx.drawImage(qrImage, 200, 200, 800, 800);

    // Load and draw logo
    try {
      const logo = await loadImage(process.cwd() + '/public/logo_web.png');
      const logoSize = 240; // 30% of QR code size
      ctx.drawImage(
        logo,
        600 - logoSize/2, // center horizontally
        600 - logoSize/2, // center vertically
        logoSize,
        logoSize
      );
    } catch (logoError) {
      console.error('Error loading logo:', logoError);
      // Continue without logo if it fails to load
    }

    // Add text details
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Vehicle Tag', 600, 1100);

    ctx.font = '36px Arial';
    ctx.fillText(`${vehicleDetails.registrationNumber}`, 600, 1160);
    ctx.fillText(`${vehicleDetails.brand} ${vehicleDetails.model} • ${vehicleDetails.color}`, 600, 1220);
    ctx.fillText(`Type: ${vehicleDetails.vehicleType}`, 600, 1280);
    ctx.fillText(`Valid until: ${vehicleDetails.validUntil}`, 600, 1340);

    // Convert canvas to data URL
    const shareableImageDataUrl = canvas.toDataURL('image/png');

    res.status(200).json({
      qrCode: qrCodeDataUrl,
      shareableImage: shareableImageDataUrl
    });

  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ message: 'Error generating QR code' });
  }
} 