import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Splide, SplideSlide } from '@splidejs/react-splide';
import '@splidejs/react-splide/css';

const VolunteerRequests = () => {
  const [requests, setRequests] = useState([]);
  const [volunteer, setVolunteer] = useState(null);
  const [volunteerId, setVolunteerId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [loadingNgo, setLoadingNgo] = useState(false);
  const [error, setError] = useState(null);
  const [ngoDetails, setNgoDetails] = useState({}); // Store NGO details keyed by ngoId
  const router = useRouter();

  // Fetch the volunteer profile to get the volunteer ID
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('volunteerToken');
        if (!token) {
          router.push('/login');
          return;
        }

        const response = await fetch('/api/volunteerProfile', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        setVolunteer(data);
        setVolunteerId(data._id); // Store the volunteer ID
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError(error.message);
        if (error.message === 'Failed to fetch profile') {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  // Fetch requests for the specific volunteer
  useEffect(() => {
    if (!volunteerId) return;

    const fetchRequests = async () => {
      setLoadingRequests(true);
      try {
        const response = await fetch(`/api/acceptRequest?volunteerId=${volunteerId}`, {
          method: 'GET', // Use GET for fetching requests
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        if (Array.isArray(data)) {
          setRequests(data);
          // Fetch NGO details for each request after loading the requests
          const ngoIds = data.map((request) => request.ngoId);
          fetchNgoDetails(ngoIds);
        } else {
          console.error("Invalid data format: Expected an array");
          setRequests([]);
        }
      } catch (error) {
        console.error('Error fetching requests:', error);
        setError('Failed to fetch requests');
        setRequests([]);
      } finally {
        setLoadingRequests(false);
      }
    };

    fetchRequests();
  }, [volunteerId]);

  // Fetch NGO details for all NGO IDs from the requests
  const fetchNgoDetails = async (ngoIds) => {
    setLoadingNgo(true);
    try {
      // Fetch all NGO details in parallel for the unique ngoIds
      const promises = ngoIds.map(async (ngoId) => {
        const response = await fetch(`/api/getNgoDetails?ngoId=${ngoId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch NGO details');
        }
        const ngoData = await response.json();
        setNgoDetails((prevDetails) => ({
          ...prevDetails,
          [ngoId]: ngoData, // Store NGO details by ngoId
        }));
      });

      await Promise.all(promises); // Wait for all NGO details to be fetched
    } catch (error) {
      console.error('Error fetching NGO details:', error);
    } finally {
      setLoadingNgo(false);
    }
  };

  // Function to accept a request
  const acceptRequest = async (requestId) => {
    try {
      const token = localStorage.getItem('volunteerToken');

      const response = await fetch(`/api/acceptRequest`, {
        method: 'PUT', // Use PUT for accepting a request
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId }), // Pass requestId to update the request status
      });

      if (response.ok) {
        alert('Request accepted successfully');
        setRequests((prevRequests) =>
          prevRequests.map((request) =>
            request._id === requestId ? { ...request, status: 'Accepted' } : request
          )
        );
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  if (loading) return <p>Loading profile...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Volunteer Requests</h2>
      {loadingRequests ? (
        <p>Loading requests...</p>
      ) : requests.length === 0 ? (
        <p>No pending requests.</p>
      ) : (
        <ul className="flex flex-col">
          {requests.map((request) => (
            <li key={request._id} className="p-4 border h-96 mb-3 w-full border-gray-300 rounded-lg flex flex-col justify-between">
              <div className="flex flex-row justify-between p-2 m-5">
                {/* Left Section: NGO Name and Details */}
                <div className="text-details w-2/4 flex justify-center flex-col">
                  <h3 className="text-3xl pb-3 border-b font-medium">
                    {ngoDetails[request.ngoId] ? ngoDetails[request.ngoId].ngoName : 'Loading...'}
                  </h3>
                  <p className="border-b text-xl mt-3 pb-1">Request Details</p>
                  <p className="pb-1 font-bold">Request Date: <span className="font-normal">{new Date(request.hireDate).toLocaleDateString()}</span></p>
                  <p className="pb-1 font-bold">Status: <span className="font-normal">{request.status}</span></p>
                  <div className="p-2">
                    <p className="font-bold">Contact No: <span className="font-normal">{ngoDetails[request.ngoId]?.contactNo}</span></p>
                    <p className="font-bold">Manager: <span className="font-normal">{ngoDetails[request.ngoId]?.managerName}</span></p>
                    <p className="font-bold">Capital: <span className="font-normal">{ngoDetails[request.ngoId]?.capital}</span></p>
                    <p className="font-bold">Manager Contact: <span className="font-normal">{ngoDetails[request.ngoId]?.managerContactNo}</span></p>
                    <p className="font-bold">Address: <span className="font-normal">{ngoDetails[request.ngoId]?.address}</span></p>
                    <p className="font-bold">Type: <span className="font-normal">{ngoDetails[request.ngoId]?.ngoType}</span></p>
                    <p className="font-bold">Website: <span className="font-normal"><a href={ngoDetails[request.ngoId]?.websiteLink} target="_blank" rel="noopener noreferrer">{ngoDetails[request.ngoId]?.websiteLink}</a></span></p>
                  </div>
                </div>

                {/* Right Section: NGO Info and Image Carousel */}
                <div className="right-view-con w-2/4 flex justify-center items-center">
                  <div className="slider-image w-full">
                    <Splide options={{ type: 'loop', perPage: 1, autoplay: true }}>
                      {ngoDetails[request.ngoId]?.ngoImages?.map((image, index) => (
                        <SplideSlide key={index}>
                          <img
                            src={image}
                            alt={`NGO Image ${index + 1}`}
                            className="w-60 h-60 mx-auto rounded-lg object-cover"
                          />
                        </SplideSlide>
                      ))}
                    </Splide>
                  </div>
                </div>
              </div>
              {/* Accept button */}
              {request.status === 'Pending' && (
                <button
                  onClick={() => acceptRequest(request._id)}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  Accept
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default VolunteerRequests;
