import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { FiUpload, FiTrash2, FiEdit2, FiDownload, FiCheck, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { AuthProvider } from '../context/AuthContex';

const FileUploadPage = () => {
  const { id } = useParams();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [editingFilename, setEditingFilename] = useState(null);
  const [tempFilename, setTempFilename] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const {isAuthenticated }= AuthProvider()
  console.log(isAuthenticated);
  
  

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const { data } = await axios.get(`/api/projects/${id}`);
        setFiles(data.data.images || []);
        if (data.data.shareLinks?.[0]?.expiresAt) {
          setExpiryDate(new Date(data.data.shareLinks[0].expiresAt).toLocaleDateString());
        }
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to fetch files');
      }
    };
    fetchFiles();
  }, [id]);

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    const validFiles = selectedFiles.filter(file => 
      ['image/jpeg', 'image/png', 'application/pdf'].includes(file.type) && 
      file.size <= 5 * 1024 * 1024
    );

    if (validFiles.length !== selectedFiles.length) {
      toast.error('Only JPG/PNG images and PDFs under 5MB are allowed');
    }

    if (validFiles.length > 0) {
      setUploading(true);
      const formData = new FormData();
      validFiles.forEach(file => formData.append('files', file));

      try {
        const { data } = await axios.put(`/api/projects/${id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        setFiles(data.data.images);
        toast.success('Files uploaded successfully');
      } catch (error) {
        toast.error(error.response?.data?.error || 'Upload failed');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleDelete = async (fileUrl) => {
    try {
      const { data } = await axios.post(`/api/projects/${id}/remove-file`, { fileUrl });
      setFiles(data.data.images);
      toast.success('File deleted successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Delete failed');
    }
  };

  const handleRename = async (fileUrl) => {
    try {
      const { data } = await axios.post(`/api/projects/${id}/rename-file`, {
        oldUrl: fileUrl,
        newName: tempFilename
      });
      setFiles(data.data.images);
      setEditingFilename(null);
      toast.success('File renamed successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Rename failed');
    }
  };

  const handleDownload = (fileUrl) => {
    window.open(fileUrl, '_blank');
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">File Management</h1>
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Upload Files</h2>
            {expiryDate && (
              <span className="text-sm text-gray-600">
                Expires: {expiryDate}
              </span>
            )}
          </div>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <FiUpload className="mx-auto text-4xl text-gray-400 mb-2" />
            <p className="mb-4">Drag & drop files here or click to select</p>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className={`px-4 py-2 rounded-md text-white ${uploading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} cursor-pointer`}
            >
              {uploading ? 'Uploading...' : 'Select Files'}
            </label>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Files</h2>
          {files.length === 0 ? (
            <p className="text-gray-500">No files uploaded yet</p>
          ) : (
            <div className="space-y-2">
              {files.map((file, index) => {
                const fileName = file.url.split('/').pop();
                const isEditing = editingFilename === file.url;
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center flex-1 min-w-0">
                      {isEditing ? (
                        <>
                          <input
                            type="text"
                            value={tempFilename}
                            onChange={(e) => setTempFilename(e.target.value)}
                            className="border rounded px-2 py-1 mr-2 flex-1"
                          />
                          <span className="text-gray-500">.{fileName.split('.').pop()}</span>
                          <button
                            onClick={() => handleRename(file.url)}
                            className="ml-2 text-green-600 hover:text-green-800"
                          >
                            <FiCheck />
                          </button>
                          <button
                            onClick={() => setEditingFilename(null)}
                            className="ml-1 text-red-600 hover:text-red-800"
                          >
                            <FiX />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="truncate flex-1">
                            {fileName.substring(0, fileName.lastIndexOf('.'))}
                            <span className="text-gray-500">.{fileName.split('.').pop()}</span>
                          </span>
                          <button
                            onClick={() => {
                              setEditingFilename(file.url);
                              setTempFilename(fileName.substring(0, fileName.lastIndexOf('.')));
                            }}
                            className="ml-2 text-gray-500 hover:text-blue-600"
                          >
                            <FiEdit2 />
                          </button>
                        </>
                      )}
                    </div>
                    <div className="flex items-center ml-4">
                      <span className="text-sm text-gray-500 mr-4">
                        {formatFileSize(file.size || 0)}
                      </span>
                      <button
                        onClick={() => handleDownload(file.url)}
                        className="text-blue-600 hover:text-blue-800 mr-2"
                        title="Download"
                      >
                        <FiDownload />
                      </button>
                      <button
                        onClick={() => handleDelete(file.url)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUploadPage;