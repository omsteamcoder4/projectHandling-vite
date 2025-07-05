import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiDownload, FiTrash2, FiClock, FiCalendar } from 'react-icons/fi';
import { toast } from 'react-toastify';

const ActivityPage = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get('/api/projects/activities');
        setActivities(data.data);
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to load activities');
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, []);

  const handleDownload = (fileUrl) => {
    window.open(fileUrl, '_blank');
  };

  const handleDelete = async (projectId, fileUrl) => {
    try {
      await axios.post(`/api/projects/${projectId}/remove-file`, { fileUrl });
      setActivities(activities.map(activity => 
        activity._id === projectId 
          ? { 
              ...activity, 
              files: activity.files.filter(f => f.url !== fileUrl),
              totalSize: activity.totalSize - (activity.files.find(f => f.url === fileUrl)?.size || 0)
            } 
          : activity
      ));
      toast.success('File deleted successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete file');
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">My Activity</h1>
      
      {activities.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-500">No recent activity found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {activities.map((activity) => (
            <div key={activity._id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">{activity.name}</h2>
                  <div className="flex items-center text-sm text-gray-500">
                    <FiCalendar className="mr-1" />
                    <span>Created: {formatDate(activity.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <FiClock className="mr-1" />
                  <span>Expires: {formatDate(activity.expiresAt)}</span>
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">Files ({activity.files.length})</h3>
                  <span className="text-sm text-gray-500">
                    Total size: {formatFileSize(activity.totalSize)}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {activity.files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center flex-1 min-w-0">
                        <span className="truncate">
                          {file.url.split('/').pop()}
                        </span>
                      </div>
                      <div className="flex items-center ml-4">
                        <span className="text-sm text-gray-500 mr-4">
                          {formatFileSize(file.size)}
                        </span>
                        <button
                          onClick={() => handleDownload(file.url)}
                          className="text-blue-600 hover:text-blue-800 mr-2"
                          title="Download"
                        >
                          <FiDownload />
                        </button>
                        <button
                          onClick={() => handleDelete(activity._id, file.url)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityPage;