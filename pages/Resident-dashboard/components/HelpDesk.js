import React, { useState, useEffect } from 'react';
import { Headphones, Phone, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import ChatModal from '../../../components/Community/ChatModal';

const HelpDesk = () => {
  const router = useRouter();
  const [societyManagerPhone, setSocietyManagerPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [userData, setUserData] = useState(null);
  const [societyData, setSocietyData] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('Resident');
        if (!token) {
          router.push('/residentLogin');
          return;
        }

        // Get resident details
        const userResponse = await fetch('/api/Resident-Api/get-resident-details', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!userResponse.ok) throw new Error('Failed to fetch profile');
        const userDataResponse = await userResponse.json();
        setUserData(userDataResponse);
        
        // Fetch society details
        const response = await fetch('/api/Resident-Api/society-details', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            societyCode: userDataResponse.societyCode
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          setSocietyData(data.society);
          if (data.society && data.society.managerPhone) {
            setSocietyManagerPhone(data.society.managerPhone);
          }

          // Fetch messages
          const messagesResponse = await fetch(`/api/chat/helpdesk-messages?residentId=${userDataResponse._id}&societyId=${userDataResponse.societyCode}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (messagesResponse.ok) {
            const messagesData = await messagesResponse.json();
            // Format messages for ChatModal
            const formattedMessages = messagesData.messages.map(msg => ({
              id: msg._id,
              text: msg.message,
              timestamp: msg.timestamp,
              status: msg.status,
              isIncoming: !msg.isFromResident,
              media: msg.media || null
            }));
            setMessages(formattedMessages);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [router]);

  const sendMessage = async () => {
    if (!newMessage.trim() && selectedFiles.length === 0) return;
    
    setSending(true);
    try {
      const token = localStorage.getItem('Resident');
      const response = await fetch('/api/chat/helpdesk-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          residentId: userData._id,
          societyId: userData.societyCode,
          message: newMessage,
          isFromResident: true
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Format new message for ChatModal
        const newMessageObj = {
          id: data.message._id,
          text: data.message.message,
          timestamp: data.message.timestamp,
          status: 'sent',
          isIncoming: false,
          media: data.message.media || null
        };
        setMessages(prev => [...prev, newMessageObj]);
        setNewMessage('');
        setSelectedFiles([]);
      } else {
        toast.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const navigateBack = () => {
    router.push('/Resident-dashboard');
  };

  // Create a mock resident object for the society manager
  const managerResident = societyData ? {
    _id: societyData._id,
    name: societyData.managerName || 'Society Manager',
    userImage: null,
    flatDetails: { flatNumber: 'Manager' }
  } : null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white p-4 relative shadow-md">
        <div className="flex items-center">
          <button onClick={navigateBack} className="mr-4 hover:bg-white/10 p-2 rounded-full transition-colors">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Help Desk</h1>
            <p className="text-sm opacity-90">Contact society management</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full p-4">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="fixed inset-0">
            <ChatModal
              selectedResident={managerResident}
              chatMessages={messages}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              onClose={navigateBack}
              onSend={sendMessage}
              selectedFiles={selectedFiles}
              setSelectedFiles={setSelectedFiles}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default HelpDesk; 