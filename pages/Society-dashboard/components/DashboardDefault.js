import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import PreloaderSociety from '../../components/PreloaderSociety';

// Add these imports at the top
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import Image from 'next/image';

export default function Dashboard() {
  const [dateRange, setDateRange] = useState("month");
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('Society');
        if (!token) {
          router.push('/societyLogin');
          return;
        }

        // Get society details first
        const userResponse = await fetch('/api/Society-Api/get-society-details', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!userResponse.ok) throw new Error('Failed to fetch profile');
        const userData = await userResponse.json();

        // Fetch dashboard data using society ID from user data
        const response = await fetch(`/api/Society-Api/getDashboardStats?societyId=${userData.societyId}&userId=${userData._id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const data = await response.json();
        setDashboardData(data.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 300000);
    return () => clearInterval(interval);
  }, [router]);

  if (loading) {
    return <PreloaderSociety />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        Error: {error}
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const { societyStats, wingOccupancy, utilityData, announcements, recentActivity } = dashboardData;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Society Dashboard</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Date Range Filter */}
        <div className="flex justify-end mb-6">
          <div className="inline-flex rounded-md shadow-sm">
            <button
              type="button"
              onClick={() => setDateRange("week")}
              className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                dateRange === "week"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => setDateRange("month")}
              className={`px-4 py-2 text-sm font-medium ${
                dateRange === "month"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setDateRange("year")}
              className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                dateRange === "year"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Year
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Total Residents</h2>
            <p className="text-3xl font-bold text-blue-600">{societyStats.totalResidents}</p>
            <p className="text-sm text-gray-500 mt-2">Across {societyStats.totalFlats} flats</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Occupancy Rate</h2>
            <p className="text-3xl font-bold text-green-600">{societyStats.occupancyRate}%</p>
            <p className="text-sm text-gray-500 mt-2">Current occupancy status</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Maintenance Collection</h2>
            <p className="text-3xl font-bold text-purple-600">{societyStats.maintenanceCollection}%</p>
            <p className="text-sm text-gray-500 mt-2">₹{dashboardData.maintenanceStats.paidAmount} / ₹{dashboardData.maintenanceStats.totalAmount}</p>
          </div>
        </div>

        {/* Grid for Announcements and Recent Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Announcements section */}
          <div className="bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 p-6 border-b border-gray-200">
              Latest Announcements
            </h2>
            <div className="p-6">
              <Swiper
                modules={[Navigation, Pagination, Autoplay]}
                spaceBetween={30}
                slidesPerView={1}
                navigation
                pagination={{ clickable: true }}
                autoplay={{ delay: 3000 }}
                className="announcement-slider"
              >
                {announcements.map((announcement) => (
                  <SwiperSlide key={announcement.id}>
                    <div className="mb-6 last:mb-0">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-medium text-gray-900">{announcement.title}</h3>
                        <div className="text-right">
                          <span className="block text-sm text-gray-500">{announcement.date}</span>
                          <span className="block text-xs text-gray-400">{announcement.time}</span>
                        </div>
                      </div>
                      {announcement.images?.length > 0 && (
                        <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden">
                          <Swiper
                            modules={[Pagination]}
                            pagination={{ clickable: true }}
                            className="announcement-images-slider"
                          >
                            {announcement.images.map((image, index) => (
                              <SwiperSlide key={index}>
                                <Image
                                  src={image}
                                  alt={`${announcement.title} - Image ${index + 1}`}
                                  fill
                                  className="object-cover"
                                />
                              </SwiperSlide>
                            ))}
                          </Swiper>
                        </div>
                      )}
                      <p className="mt-2 text-gray-600">{announcement.description}</p>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>

          {/* Recent Activity section */}
          <div className="bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 p-6 border-b border-gray-200">
              Recent Activity
            </h2>
            <div className="overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {recentActivity.map((activity) => (
                  <li key={activity.id} className="px-6 py-4">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium text-gray-900">{activity.activity}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(activity.date).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Flat: {activity.flatNo}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Utility Usage section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Utility Usage</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Water (L)</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Electricity (kWh)</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gas (m³)</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Internet (GB)</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Other</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {utilityData.map((data) => (
                  <tr key={data.month}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{data.month}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{data.water?.toLocaleString() || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{data.electricity?.toLocaleString() || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{data.gas?.toLocaleString() || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{data.internet?.toLocaleString() || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{data.other?.toLocaleString() || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}