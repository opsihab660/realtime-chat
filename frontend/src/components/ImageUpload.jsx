import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import imageCompression from 'browser-image-compression';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { fileAPI } from '../services/api';

const ImageUpload = ({ onImageUpload, onClose, isVisible }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewImage, setPreviewImage] = useState(null);
  const [caption, setCaption] = useState('');
  const [compressing, setCompressing] = useState(false);

  const compressImage = async (file) => {
    try {
      setCompressing(true);
      
      const options = {
        maxSizeMB: 0.1, // 100KB
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: file.type,
      };
      
      const compressedFile = await imageCompression(file, options);
      console.log('Original file size:', file.size / 1024, 'KB');
      console.log('Compressed file size:', compressedFile.size / 1024, 'KB');
      
      return compressedFile;
    } catch (error) {
      console.error('Image compression error:', error);
      throw error;
    } finally {
      setCompressing(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target.result);
      };
      reader.readAsDataURL(file);

      // Compress image if larger than 100KB
      let fileToUpload = file;
      if (file.size > 100 * 1024) {
        toast.loading('Compressing image...', { id: 'compressing' });
        fileToUpload = await compressImage(file);
        toast.dismiss('compressing');
        toast.success('Image compressed successfully');
      }

      // Upload image
      setUploading(true);
      setUploadProgress(0);

      const response = await fileAPI.uploadImage(fileToUpload, (progress) => {
        setUploadProgress(progress);
      });

      if (response.data && response.data.file) {
        onImageUpload(response.data.file, caption);
        toast.success('Image uploaded successfully');
        handleClose();
      }
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload image');
      setPreviewImage(null);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [onImageUpload, caption]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: false,
    disabled: uploading || compressing
  });

  const handleClose = () => {
    setPreviewImage(null);
    setUploadProgress(0);
    setUploading(false);
    setCaption('');
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Upload Image
          </h3>
          <button
            onClick={handleClose}
            disabled={uploading || compressing}
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
              <div className="relative">
                <img
                  src={previewImage}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                {(uploading || compressing) && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                    <div className="text-white text-center">
                      <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-sm">{compressing ? 'Compressing...' : `Uploading... ${uploadProgress}%`}</p>
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
                ${(uploading || compressing) ? 'pointer-events-none opacity-50' : ''}
              `}
            >
              <input {...getInputProps()} />
              <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                {isDragActive
                  ? 'Drop the image here...'
                  : 'Drag & drop an image here, or click to select'
                }
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Supports JPEG, PNG, GIF, WebP (max 5MB, will be compressed to 100KB)
              </p>
            </div>
          )}

          {/* Caption input */}
          {previewImage && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Caption (optional)
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption to your image..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows="2"
                maxLength="200"
                disabled={uploading || compressing}
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                {caption.length}/200
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClose}
            disabled={uploading || compressing}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;
