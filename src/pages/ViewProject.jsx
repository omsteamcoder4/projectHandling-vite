import React, { useState, useEffect } from 'react';
import { 
  FiDownload, 
  FiCalendar, 
  FiAlertCircle, 
  FiCreditCard, 
  FiStar, 
  FiWifi,
  FiChevronDown,
  FiChevronUp
} from 'react-icons/fi';
import axios from 'axios';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const ViewProject = () => {
  const [activities, setActivities] = useState({
    today: [],
    yesterday: [],
    older: []
  });
  const [loading, setLoading] = useState(true);
  const [creditInfo, setCreditInfo] = useState({
    remaining: 0,
    plan: 'Free Plan'
  });
  const [expandedSections, setExpandedSections] = useState({
    today: true,
    yesterday: false,
    older: false
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch activities
        const activitiesRes = await axios.get('/api/projects/activities', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        // Categorize activities by date
        const today = [];
        const yesterday = [];
        const older = [];
        const now = dayjs();
        
        activitiesRes.data.forEach(activity => {
          const activityDate = dayjs(activity.createdAt);
          const diffDays = now.diff(activityDate, 'day');
          
          if (diffDays === 0) today.push(activity);
          else if (diffDays === 1) yesterday.push(activity);
          else older.push(activity);
        });
        
        setActivities({ today, yesterday, older });
        
        // Fetch credit info
        const creditRes = await axios.get('/api/user/credits', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setCreditInfo(creditRes.data);
        
      } catch (error) {
        toast.error('Failed to load data');
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleDownload = async (fileId) => {
    try {
      const res = await axios.get(`/api/projects/download/${fileId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileId);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
    } catch (error) {
      toast.error('Download failed');
      console.error('Download error:', error);
    }
  };

  const handleDownloadAll = async (files) => {
    try {
      const res = await axios.post('/api/projects/download/batch', 
        { files },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          responseType: 'blob'
        }
      );
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `download-${Date.now()}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
    } catch (error) {
      toast.error('Batch download failed');
      console.error('Batch download error:', error);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderActivityItem = (activity) => (
    <div key={activity._id} className="border-b border-gray-200 pb-4 mb-4 last:border-0">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-medium text-gray-800">{activity.name}</h3>
          <div className="flex items-center text-sm text-gray-500 mt-1">
            <FiCalendar className="mr-1" />
            <span>Expires {dayjs(activity.expiresAt).fromNow()}</span>
            <span className="mx-2">~</span>
            <span>{activity.files?.length || 0} Files</span>
            <span className="mx-2">+</span>
            <span>{formatFileSize(activity.totalSize || 0)}</span>
          </div>
        </div>
        <button 
          onClick={() => handleDownload(activity._id)}
          className="text-blue-600 hover:text-blue-800"
        >
          <FiDownload size={20} />
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-800 mb-8">My Activity</h1>

        {/* Today's Activity */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div 
            className="flex justify-between items-center cursor-pointer"
            onClick={() => toggleSection('today')}
          >
            <h2 className="text-xl font-semibold text-gray-700">Today</h2>
            {expandedSections.today ? <FiChevronUp /> : <FiChevronDown />}
          </div>
          
          {expandedSections.today && (
            <>
              {activities.today.length > 0 ? (
                <>
                  {activities.today.map(renderActivityItem)}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <button 
                      onClick={() => handleDownloadAll(activities.today.map(a => a._id))}
                      className="flex items-center justify-center w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <FiDownload className="mr-2" />
                      Download All
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-gray-500 mt-4">No activity today</p>
              )}
            </>
          )}
        </div>

        {/* Yesterday's Activity */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div 
            className="flex justify-between items-center cursor-pointer"
            onClick={() => toggleSection('yesterday')}
          >
            <h2 className="text-xl font-semibold text-gray-700">Yesterday</h2>
            {expandedSections.yesterday ? <FiChevronUp /> : <FiChevronDown />}
          </div>
          
          {expandedSections.yesterday && (
            <>
              {activities.yesterday.length > 0 ? (
                activities.yesterday.map(renderActivityItem)
              ) : (
                <p className="text-gray-500 mt-4">No activity yesterday</p>
              )}
            </>
          )}
        </div>

        {/* Older Activity */}
        {activities.older.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div 
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection('older')}
            >
              <h2 className="text-xl font-semibold text-gray-700">Older</h2>
              {expandedSections.older ? <FiChevronUp /> : <FiChevronDown />}
            </div>
            
            {expandedSections.older && (
              activities.older.map(renderActivityItem)
            )}
          </div>
        )}

        {/* Upgrade Prompt */}
        {creditInfo.plan === 'Free Plan' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8 flex items-start">
            <FiAlertCircle className="text-yellow-500 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-yellow-800 mb-1">Need more features?</h3>
              <p className="text-yellow-700 text-sm">
                Need larger uploads, longer expirations & advanced AI features?
              </p>
              <button className="mt-2 text-yellow-700 font-medium hover:text-yellow-800">
                Upgrade
              </button>
            </div>
          </div>
        )}

        {/* Credit Balance Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Credit Balance</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FiCreditCard className="text-gray-500 mr-2" />
                <span className="text-gray-700">
                  {creditInfo.remaining} credits remaining
                </span>
              </div>
              <span className="text-gray-500">♦️</span>
            </div>

            <button className="w-full flex items-center justify-between py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
              <span className="text-gray-700">Buy more Credits</span>
              <FiCreditCard className="text-gray-500" />
            </button>

            <button className="w-full flex items-center justify-between py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
              <span className="text-gray-700">My Subscription</span>
              <FiStar className="text-gray-500" />
            </button>

            <div className="flex items-center justify-between py-2 px-4 bg-gray-50 rounded-md">
              <span className="text-gray-700">{creditInfo.plan}</span>
              <span className="text-xs text-gray-500">Current Plan</span>
            </div>

            <button className="w-full flex items-center justify-between py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
              <span className="text-gray-700">Manage Subscription</span>
              <FiStar className="text-gray-500" />
            </button>

            <button className="w-full flex items-center justify-between py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
              <span className="text-gray-700">Nearby Devices</span>
              <FiWifi className="text-gray-500" />
              <span className="text-xs text-gray-400">😊</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewProject;