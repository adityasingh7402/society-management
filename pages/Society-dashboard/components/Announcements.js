import React, { useState } from 'react';

export default function Announcements() {
  // State for new announcement
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  // State for previous announcements
  const [announcements, setAnnouncements] = useState([
    {
      id: 1,
      title: "Maintenance Shutdown",
      description: "There will be a water supply shutdown on March 15th for maintenance work.",
      image: "https://via.placeholder.com/150",
      date: "2025-03-15",
      time: "10:00 AM"
    },
    {
      id: 2,
      title: "Society Meeting",
      description: "A general meeting will be held on March 20th at the community hall.",
      image: "https://via.placeholder.com/150",
      date: "2025-03-20",
      time: "05:00 PM"
    }
  ]);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    const newAnnouncement = {
      id: announcements.length + 1,
      title,
      description,
      image: image ? URL.createObjectURL(image) : null,
      date,
      time
    };
    setAnnouncements([newAnnouncement, ...announcements]);
    setTitle("");
    setDescription("");
    setImage(null);
    setDate("");
    setTime("");
  };

  // Handle delete announcement
  const handleDelete = (id) => {
    setAnnouncements(announcements.filter((announcement) => announcement.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* New Announcement Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Announcement</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                  rows="3"
                  required
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Image</label>
                <input
                  type="file"
                  onChange={(e) => setImage(e.target.files[0])}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              {/* Date and Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-6">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Post Announcement
              </button>
            </div>
          </form>
        </div>

        {/* Previous Announcements */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Previous Announcements</h2>
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{announcement.title}</h3>
                    <p className="text-sm text-gray-600">{announcement.description}</p>
                    <p className="text-sm text-gray-500">
                      {announcement.date} at {announcement.time}
                    </p>
                  </div>
                  <div>
                    <button
                      onClick={() => handleDelete(announcement.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {announcement.image && (
                  <div className="mt-4">
                    <img
                      src={announcement.image}
                      alt="Announcement"
                      className="w-full h-auto rounded-md"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}