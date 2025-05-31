import { CameraIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { fileAPI } from '../services/api';

const AvatarUpload = ({ onClose, isVisible }) => {
  const { user, updateUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewImage, setPreviewImage] = useState(null);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target.result);
    };
    reader.readAsDataURL(file);

    // Upload avatar
    setUploading(true);
    setUploadProgress(0);

    try {
      console.log('Uploading avatar file:', file.name, file.type, file.size);
      const response = await fileAPI.uploadAvatar(file, (progress) => {
        setUploadProgress(progress);
      });

      console.log('Avatar upload response:', response.data);
      
      if (response.data && response.data.user) {
        // Update user in context
        updateUser(response.data.user);
        toast.success('Profile picture updated successfully');
        handleClose();
      } else {
        console.error('Missing user data in response:', response.data);
        toast.error('Error updating profile picture. Please try again.');
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      const errorMsg = error.response?.data?.message || 'Failed to upload profile picture';
      console.error('Error details:', errorMsg);
      toast.error(errorMsg);
      setPreviewImage(null);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [updateUser]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: false,
    disabled: uploading
  });

  const handleClose = () => {
    setPreviewImage(null);
    setUploadProgress(0);
    setUploading(false);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Update Profile Picture
          </h3>
          <button
            onClick={handleClose}
            disabled={uploading}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {previewImage ? (
            <div className="space-y-4">
              {/* Preview */}
              <div className="relative mx-auto w-40 h-40 rounded-full overflow-hidden">
                <img
                  src={previewImage}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                {uploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-sm">Uploading... {uploadProgress}%</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              {uploading && (
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
              
              {/* Upload button */}
              {!uploading && (
                <div className="flex justify-center">
                  <button
                    onClick={() => onDrop([dataURLtoFile(previewImage, 'avatar.jpg')])}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Upload Picture
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Drop zone */
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${isDragActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
                }
                ${uploading ? 'pointer-events-none opacity-50' : ''}
              `}
            >
              <input {...getInputProps()} />
              <CameraIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                {isDragActive
                  ? 'Drop the image here...'
                  : 'Drag & drop an image here, or click to select'
                }
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Supports JPEG, PNG, GIF, WebP (max 2MB)
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClose}
            disabled={uploading}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function to convert data URL to File object
function dataURLtoFile(dataurl, filename) {
  if (!dataurl) return null;
  
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], filename, { type: mime });
}

export default AvatarUpload; 