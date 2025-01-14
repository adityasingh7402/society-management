import { useState } from 'react';
import axios from 'axios';

export default function message() {
  const [type, setType] = useState('otp'); // Default to 'otp'
  const [mobile, setMobile] = useState('+91'); // Default to '+91' for India
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Sending...');
    try {
      const response = await axios.post('/api/sendMessage', {
        to: mobile,
        message,
        type,
      });

      if (response.data.success) {
        setStatus('Message sent successfully!');
      } else {
        setStatus('Failed to send the message.');
      }
    } catch (error) {
      setStatus(`Error: ${error.response?.data?.error || error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center">Send Message via Twilio</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Message Type Selection */}
          <div>
            <label className="block font-medium mb-1">Message Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
            >
              <option value="otp">OTP</option>
              <option value="message">General Message</option>
            </select>
          </div>

          {/* Mobile Number Input */}
          <div>
            <label className="block font-medium mb-1">Mobile Number</label>
            <input
              type="text"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
              placeholder="+91XXXXXXXXXX"
              required
            />
          </div>

          {/* Message Input */}
          <div>
            <label className="block font-medium mb-1">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
              placeholder="Enter your message"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
          >
            Send Message
          </button>
        </form>

        {/* Status Message */}
        {status && <p className="mt-4 text-center text-sm text-gray-600">{status}</p>}
      </div>
    </div>
  );
}
