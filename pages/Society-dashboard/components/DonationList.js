import React, { useState, useEffect } from 'react';
import { Splide, SplideSlide } from '@splidejs/react-splide';
import '@splidejs/react-splide/css';

const DonationList = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchDonations = async () => {
      try {
        const response = await fetch('/api/getDonation');
        if (!response.ok) {
          throw new Error('Failed to fetch Donations');
        }
        const data = await response.json();
        setDonations(data);
      } catch (error) {
        console.error('Error fetching Donations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDonations();
  }, []);

  const filteredDonations = donations.filter(donation =>
    donation.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const updateApprovalStatus = async (id, status) => {
    try {
      const response = await fetch('/api/updateDonation', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ _id: id, approval: status }),
      });
      if (!response.ok) {
        throw new Error('Failed to update approval status');
      }
      const updatedDonation = await response.json();
      setDonations(prev =>
        prev.map(donation => (donation._id === id ? { ...donation, approval: status } : donation))
      );
      alert(updatedDonation.success);
    } catch (error) {
      console.error('Error updating approval status:', error);
    }
  };

  if (loading) return <div className='w-full mb-16'>
    <div className="container-reload w-96 flex justify-center mx-auto items-center">
      <img src="reload.gif" alt="" />
    </div>
  </div>;

  return (
    <div className="container-view">
      <div className="search-container w-full mt-10 mb-5">
        <div className="flex justify-end pr-20">
          <input
            type="text"
            placeholder="Search Donation by Name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-2 border-b-2 border-green-800 rounded w-96 outline-none"
          />
        </div>
      </div>

      {filteredDonations.length === 0 ? (
        <p>No Donations available</p>
      ) : (
        <div className="container-view-list my-14">
          {filteredDonations.map((donation) => (
            <div key={donation._id} className="child-list flex bg-white justify-start items-center mb-10 shadow-md pb-5" data-aos="fade-up" data-aos-anchor-placement="top-bottom" data-aos-duration="1000" data-aos-once="false" data-aos-easing="ease-in-out" data-aos-mirror="true">
              <div className="left-view-con w-2/4 p-3 m-10">
                <div className="text-details flex justify-center flex-col px-16">
                  <h3 className='text-3xl pb-2 border-b font-medium'>{donation.name}</h3>
                  <p className='border-b text-xl mt-3 pb-2'>Personal Details</p>
                  <p className='pb-1 font-bold'>Contact Info : <span className='font-normal'>{donation.emailPhone}</span></p>
                  <p className='pb-1 font-bold'>Address : <span className='font-normal'>{donation.address}</span></p>
                  <p className='pb-1 font-bold'>Donation : <span className='font-normal'>{donation.option}</span></p>
                  <p className='pb-1 font-bold'>Purpose of Donation : <span className='font-normal'>{donation.donorPurpose}</span></p>
                  <p className='pb-1 font-bold'>Approval Status : <span className='font-normal'>{donation.approval}</span></p>
                </div>
                {donation.approval === 'Pending' && (
                  <div className="flex justify-around mt-5">
                    <button onClick={() => updateApprovalStatus(donation._id, 'Approved')} className="bg-green-500 text-white p-2 rounded">Approve</button>
                    <button onClick={() => updateApprovalStatus(donation._id, 'Rejected')} className="bg-red-500 text-white p-2 rounded">Reject</button>
                  </div>
                )}
              </div>
              <div className="right-view-con w-2/4 flex justify-center items-center">
                <div className="slider-image">
                  <img src={donation.paymentScreenshot} className="w-96 h-auto mx-auto" alt="Donation Image" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DonationList;
