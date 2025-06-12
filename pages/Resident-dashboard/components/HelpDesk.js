import React, { useState, useEffect } from 'react';
import { Headphones, Phone, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';

const HelpDesk = () => {
  const router = useRouter();
  const [societyManagerPhone, setSocietyManagerPhone] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSocietyManagerDetails = async () => {
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
        const userData = await userResponse.json();
        console.log(userData);
        
        // Fetch society details to get manager phone
        const response = await fetch(`/api/Society-Api/get-all-security`, { 
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            societyId: userData.societyCode,
          }),
        });
        
        if (response.ok) {
          const societyData = await response.json();
          console.log(societyData);
          if (societyData.managerPhone) {
            setSocietyManagerPhone(societyData.managerPhone);
          }
        }
      } catch (error) {
        console.error('Error fetching society details:', error);
        toast.error('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSocietyManagerDetails();
  }, [router]);

  const navigateBack = () => {
    router.push('/Resident-dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
      <div className="p-6 max-w-lg mx-auto">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <Link href={`tel:${societyManagerPhone}`}>
            <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] border border-gray-100 cursor-pointer">
              <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-6 flex items-center justify-center">
                <Headphones className="h-16 w-16 text-white" />
              </div>
              <div className="p-6 text-center">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Help Desk</h3>
                <p className="text-gray-600 mb-4">Call society manager</p>
                {societyManagerPhone ? (
                  <div className="flex items-center justify-center space-x-2 text-amber-600 font-medium">
                    <Phone className="h-5 w-5" />
                    <span>{societyManagerPhone}</span>
                  </div>
                ) : (
                  <p className="text-gray-500">No phone number available</p>
                )}
              </div>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
};

export default HelpDesk; 