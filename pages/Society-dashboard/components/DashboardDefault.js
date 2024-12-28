// components/DashboardDefault.js
import React, { useEffect, useState } from 'react';
import DashboardCard from './DashboardCard';
import { Splide, SplideSlide } from '@splidejs/react-splide';
import '@splidejs/react-splide/css';

const DashboardDefault = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   const fetchDashboardData = async () => {
  //     try {
  //       const response = await fetch('/api/getDashboardData');
  //       if (!response.ok) throw new Error('Failed to fetch dashboard data');
  //       const data = await response.json();
  //       setDashboardData(data);
  //     } catch (error) {
  //       console.error('Error fetching dashboard data:', error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchDashboardData();
  // }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <DashboardCard title="Total Donations" amount={`${dashboardData.totalDonations}`} />
        <DashboardCard title="Total NGOs" amount={dashboardData.totalNGOs} />
        <DashboardCard title="Total Volunteers" amount={dashboardData.totalVolunteers}/>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-gray-600">Donation Images</h4>
          <Splide
            options={{
              type: 'loop',
              perPage: 3,
              gap: '1rem',
              autoplay: true,
              pauseOnHover: true,
            }}
            className="mt-4"
          >
            {dashboardData.donationImages.map((image, index) => (
              <SplideSlide key={index}>
                <img
                  src={image.paymentScreenshot}
                  alt={`Donation Image ${index + 1}`}
                  className="w-full h-64 object-cover rounded"
                />
              </SplideSlide>
            ))}
          </Splide>
        </div>
      </div>
    </div>
  );
};

export default DashboardDefault;
