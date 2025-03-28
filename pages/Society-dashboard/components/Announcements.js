import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { Megaphone, Calendar, Clock, Trash2, Upload, Edit, AlertCircle, X, Save, Plus, Loader2 } from 'lucide-react';
import Preloader from '../../components/Preloader';

export default function Announcements() {
  const router = useRouter();
  // Add missing state variables
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);

  // State for new announcement
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  // State modifications at the top
  const [imageFiles, setImageFiles] = useState([]); // Replace imageFile
  const [imagePreviews, setImagePreviews] = useState([]); // Replace imagePreview

  // Add missing state variables for editing and pagination
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editImageFiles, setEditImageFiles] = useState([]);
  const [editImagePreviews, setEditImagePreviews] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Add fetchAnnouncements function
  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('Society');
      if (!token) {
        router.push('/societyLogin');
        return;
      }

      const response = await axios.get(`/api/Announcement-Api/get-announcements?page=${currentPage}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setAnnouncements(response.data.announcements);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setError('Failed to fetch announcements');
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  // Add useEffect for initial fetch
  useEffect(() => {
    fetchAnnouncements();
  }, [currentPage]);

  // Add formatDate function
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Add handleEdit function
  const handleEdit = (announcement) => {
    setEditingId(announcement._id);
    setEditTitle(announcement.title);
    setEditDescription(announcement.description);
    setEditDate(announcement.date);
    setEditTime(announcement.time);
    setEditImagePreviews(announcement.image || []);
  };

  // Add handleEditImageChange function
  const handleEditImageChange = (e) => {
    const files = Array.from(e.target.files);
    setEditImageFiles(files);

    // Create previews for all selected files
    const previews = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        previews.push(reader.result);
        if (previews.length === files.length) {
          setEditImagePreviews(prev => [...prev, ...previews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Add handleSaveEdit function
  const handleSaveEdit = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('Society');
      if (!token) {
        router.push('/societyLogin');
        return;
      }

      let imageUrls = editImagePreviews.filter(url => url.startsWith('http'));
      if (editImageFiles.length > 0) {
        const newUrls = await handleImageUpload(editImageFiles);
        imageUrls = [...imageUrls, ...newUrls];
      }

      const response = await axios.put(
        `/api/Announcement-Api/update-announcement?id=${editingId}`,
        {
          title: editTitle,
          description: editDescription,
          image: imageUrls,
          date: editDate,
          time: editTime
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setSuccess('Announcement updated successfully!');
        setEditingId(null);
        fetchAnnouncements();
      }
    } catch (error) {
      console.error('Error updating announcement:', error);
      setError('Failed to update announcement');
    } finally {
      setLoading(false);
    }
  };

  // Add handleDelete function
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      const token = localStorage.getItem('Society');
      if (!token) {
        router.push('/societyLogin');
        return;
      }

      const response = await axios.delete(`/api/Announcement-Api/delete-announcement?id=${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setSuccess('Announcement deleted successfully!');
        fetchAnnouncements();
      }
    } catch (error) {
      console.error('Error deleting announcement:', error);
      setError('Failed to delete announcement');
    }
  };

  // Update the image change handler
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(files);

    // Create previews for all selected files
    const previews = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        previews.push(reader.result);
        if (previews.length === files.length) {
          setImagePreviews([...previews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Update the image upload function
  const handleImageUpload = async (files) => {
    if (!files.length) return [];

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('image', file); // Use 'image' as the field name to match the API
      });

      const response = await axios.post('/api/Announcement-Api/upload-images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        return response.data.imageUrls;
      } else {
        throw new Error(response.data.error || 'Failed to upload images');
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      throw new Error('Failed to upload images');
    }
  };

  // Update the form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem('Society');
      if (!token) {
        router.push('/societyLogin');
        return;
      }

      let imageUrls = [];
      if (imageFiles.length > 0) {
        imageUrls = await handleImageUpload(imageFiles);
      }

      const response = await axios.post(
        '/api/Announcement-Api/create-announcement',
        {
          title,
          description,
          image: imageUrls, // Now sending array of URLs
          date,
          time
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setSuccess('Announcement created successfully!');
        // Reset form
        setTitle("");
        setDescription("");
        setImageFiles([]);
        setImagePreviews([]);
        setDate("");
        setTime("");
        fetchAnnouncements();
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
      setError('Failed to create announcement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Preloader />;
  }

  // Update the image preview section in the form
  // Fix the JSX syntax errors in the return statement
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 p-4">
      {/* Header */}
      <header className="bg-white shadow-md rounded-lg border-l-4 border-blue-600 mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
            <Megaphone className="mr-3 text-blue-600" size={32} />
            Society Announcements
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto">
        {/* Status Messages */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md flex items-center">
            <AlertCircle className="mr-2" size={20} />
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md flex items-center">
            <Plus className="mr-2" size={20} />
            {success}
          </div>
        )}

        {/* New Announcement Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-blue-100">
          <h2 className="text-xl font-semibold text-blue-700 mb-4 flex items-center">
            <Megaphone className="mr-2" size={24} />
            Create New Announcement
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-300 outline-none rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-300 outline-none rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  rows="3"
                  required
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                <div className="mt-1 flex items-center">
                  <label className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                    <Upload className="mr-2 text-blue-500" size={18} />
                    {imageFiles.length ? `${imageFiles.length} files selected` : "Choose images"}
                    <input
                      type="file"
                      onChange={handleImageChange}
                      className="sr-only"
                      accept="image/*"
                      multiple // Add multiple attribute
                    />
                  </label>
                </div>
                {imagePreviews.length > 0 && (
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative w-32 h-32">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="object-cover rounded-md w-full h-full"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newFiles = imageFiles.filter((_, i) => i !== index);
                            const newPreviews = imagePreviews.filter((_, i) => i !== index);
                            setImageFiles(newFiles);
                            setImagePreviews(newPreviews);
                          }}
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <Calendar className="mr-1 text-blue-500" size={16} />
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="mt-1 block w-full p-2 border border-gray-300 outline-none rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <Clock className="mr-1 text-blue-500" size={16} />
                    Time
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="mt-1 block w-full p-2 border border-gray-300 outline-none rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-6">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-md flex items-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={16} />
                    Processing...
                  </>
                ) : (
                  <>
                    <Megaphone className="mr-2" size={16} />
                    Post Announcement
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Previous Announcements */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-blue-100">
          <h2 className="text-xl font-semibold text-blue-700 mb-4 flex items-center">
            <Megaphone className="mr-2" size={24} />
            Previous Announcements
          </h2>

          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-blue-50 rounded-lg">
              <Megaphone className="mx-auto text-blue-300 mb-2" size={48} />
              <p>No announcements found. Create your first announcement above.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {announcements.map((announcement) => (
                <div
                  key={announcement._id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-300 bg-white relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
                  {editingId === announcement._id ? (
                    <div className="animate-fadeIn">
                      {/* Edit form content */}
                      <h3 className="text-xl font-semibold text-blue-700 mb-4 flex items-center">
                        <Edit className="mr-2" size={20} />
                        Edit Announcement
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="mt-1 block w-full p-2 border border-gray-300 outline-none rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="mt-1 block w-full p-2 border border-gray-300 outline-none rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            rows="3"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Add More Images</label>
                          <div className="mt-1 flex items-center">
                            <label className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                              <Upload className="mr-2 text-blue-500" size={18} />
                              {editImageFiles.length ? `${editImageFiles.length} new files selected` : "Choose more images"}
                              <input
                                type="file"
                                onChange={handleEditImageChange}
                                className="sr-only"
                                accept="image/*"
                                multiple
                              />
                            </label>
                          </div>
                          {editImagePreviews.length > 0 && (
                            <div className="mt-2 grid grid-cols-3 gap-2">
                              {editImagePreviews.map((preview, index) => (
                                <div key={index} className="relative w-24 h-24">
                                  <img
                                    src={preview}
                                    alt={`Preview ${index + 1}`}
                                    className="object-cover rounded-md w-full h-full"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newPreviews = [...editImagePreviews];
                                      newPreviews.splice(index, 1);
                                      setEditImagePreviews(newPreviews);
                                    }}
                                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                              <Calendar className="mr-1 text-blue-500" size={16} />
                              Date
                            </label>
                            <input
                              type="date"
                              value={editDate}
                              onChange={(e) => setEditDate(e.target.value)}
                              className="mt-1 block w-full p-2 border border-gray-300 outline-none rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                              <Clock className="mr-1 text-blue-500" size={16} />
                              Time
                            </label>
                            <input
                              type="time"
                              value={editTime}
                              onChange={(e) => setEditTime(e.target.value)}
                              className="mt-1 block w-full p-2 border border-gray-300 outline-none rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                              required
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex space-x-2">
                        <button
                          onClick={handleSaveEdit}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-md flex items-center"
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <Loader2 className="animate-spin mr-2" size={16} />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2" size={16} />
                              Save Changes
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors flex items-center"
                        >
                          <X className="mr-2" size={16} />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-blue-700 hover:text-blue-800 transition-colors">
                            {announcement.title}
                          </h3>
                          <p className="text-gray-600 mt-3 leading-relaxed">{announcement.description}</p>
                          <div className="flex items-center mt-4 text-sm text-gray-500 space-x-4">
                            <span className="flex items-center bg-blue-50 px-3 py-1 rounded-full">
                              <Calendar className="mr-2 text-blue-500" size={14} />
                              {formatDate(announcement.date)}
                            </span>
                            <span className="flex items-center bg-blue-50 px-3 py-1 rounded-full">
                              <Clock className="mr-2 text-blue-500" size={14} />
                              {announcement.time}
                            </span>
                          </div>
                        </div>
                        <div className="mt-4 md:mt-0 md:ml-6 flex space-x-2">
                          <button
                            onClick={() => handleEdit(announcement)}
                            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-all duration-300 flex items-center"
                          >
                            <Edit className="mr-2" size={16} /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(announcement._id)}
                            className="px-4 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-all duration-300 flex items-center"
                          >
                            <Trash2 className="mr-2" size={16} /> Delete
                          </button>
                        </div>
                      </div>
                      {announcement.image && announcement.image.length > 0 && (
                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          {announcement.image.map((img, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={img}
                                alt={`${announcement.title} - Image ${index + 1}`}
                                className="w-full h-48 object-cover rounded-lg shadow-sm group-hover:shadow-md transition-all duration-300"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 rounded-lg" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center space-x-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-4 py-2 rounded-md transition-all duration-300 ${currentPage === page
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}