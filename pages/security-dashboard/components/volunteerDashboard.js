import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';


export default function Profile() {
  const [volunteer, setVolunteer] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [profilePhotos, setProfilePhotos] = useState([]); // Change to store multiple images
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        setFormData(data);
        setProfilePhotos(data.profilePhotos || []); // Assuming your data has an array of profile photos
      } catch (error) {
        console.error('Error fetching profile:', error);
        if (error.message === 'Failed to fetch profile') {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleLogout = () => {
    // Remove the token from localStorage (adjust if you have other tokens)
    localStorage.removeItem('ngoToken');
    localStorage.removeItem('volunteerToken'); // Add this if you also support volunteers

    // Redirect to the login page
    router.push('/Login').then(() => {
      window.location.reload(); // Optionally reload the page after redirection
    });
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'profilePhotos') {
      setProfilePhotos(Array.from(files)); // Store all selected images
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('volunteerToken');
      const formDataToSend = new FormData();

      for (const key in formData) {
        formDataToSend.append(key, formData[key]);
      }

      profilePhotos.forEach((photo) => {
        formDataToSend.append('profilePhotos', photo); // Append each photo to FormData
      });

      const response = await fetch('/api/updateVolunteer', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await response.json();
      setVolunteer(data);
      setEditMode(false);
      alert('Profile updated successfully');
      router.reload();
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className='w-full h-screen flex items-center justify-center'>
      <div className="container-reload flex justify-center items-center">
        <img src="reload.gif" alt="Loading..." />
      </div>
    </div>
  );

  if (!volunteer) return <p className="text-center">No profile data available</p>;

  return (
    <div className="flex flex-row bg-gray-100">
      {/* Sidebar */}
      <aside className="w-1/3 h-2/4 bg-white p-6 rounded shadow-lg flex flex-col justify-center items-center">
        <div className="slider-image">
          <img src={volunteer.photo} className="w-96 mx-auto" alt={`Volunteer Image ${volunteer.photo}`} />
        </div>
        <h1 className="text-5xl text-green-800 font-semibold mb-2">{volunteer.name}</h1>
        <button onClick={handleLogout} className="mt-8 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white">
          Log Out
        </button>
      </aside>

      {/* Profile Content */}
      <main className="w-2/3 pl-5 overflow-y-auto">
        <div className="bg-white p-6 rounded shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-4xl font-semibold text-gray-800">Volunteer Profile</h2>
            <button onClick={() => setEditMode(!editMode)} className="bg-green-600 text-white px-4 py-2 rounded shadow-lg hover:bg-green-700">
              {editMode ? "Cancel Edit" : "Edit Profile"}
            </button>
          </div>

          {!editMode ? (
            <div className="space-y-4">
              <p><strong>Email:</strong> {volunteer.email}</p>
              <p><strong>Contact No:</strong> {volunteer.phoneNo}</p>
              <p><strong>Address:</strong> {volunteer.address}</p>
              <p><strong>Qualification:</strong> {volunteer.qualification}</p>
              <p><strong>Purpose/Aim:</strong> {volunteer.purposeAim}</p>
            </div>
          ) : (
            <form onSubmit={handleUpdate} className="space-y-4">
              <input type="text" name="name" placeholder="Name" value={formData.name || ''} onChange={handleChange} className="block w-full p-2 border rounded" />
              <input type="email" name="email" placeholder="Email" value={formData.email || ''} onChange={handleChange} className="block w-full p-2 border rounded" />
              <input type="text" name="phoneNo" placeholder="Contact No" value={formData.phoneNo || ''} onChange={handleChange} className="block w-full p-2 border rounded" />
              <input type="text" name="address" placeholder="Address" value={formData.address || ''} onChange={handleChange} className="block w-full p-2 border rounded" />
              <input type="text" name="qualification" placeholder="Qualification" value={formData.qualification || ''} onChange={handleChange} className="block w-full p-2 border rounded" />
              <input type="text" name="purposeAim" placeholder="Purpose/Aim" value={formData.purposeAim || ''} onChange={handleChange} className="block w-full p-2 border rounded" />
              <input type="file" name="profilePhotos" onChange={handleChange} multiple className="block w-full p-2 border rounded" />
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded"><h6>{isSubmitting ? "WAIT..." : "Save Changes"}</h6></button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
