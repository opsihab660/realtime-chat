import { randomBytes } from 'crypto';
import express from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticateToken } from '../middleware/auth.js';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
// Fixed crypto import issue

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/images');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate random ID using crypto for better uniqueness
    const randomId = randomBytes(16).toString('hex');
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    const filename = `img_${randomId}_${timestamp}${extension}`;
    cb(null, filename);
  }
});

// Configure avatar storage separately
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/avatars');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate random ID using crypto for better uniqueness
    const randomId = randomBytes(8).toString('hex');
    const userId = req.user._id;
    const extension = path.extname(file.originalname);
    const filename = `avatar_${userId}_${randomId}${extension}`;
    cb(null, filename);
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Configure avatar upload
const avatarUpload = multer({
  storage: avatarStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit for avatars
  }
});

// Upload image endpoint
router.post('/image', authenticateToken, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'No image file provided',
        error: 'NO_FILE'
      });
    }

    // Generate unique image ID for database reference
    const imageId = randomBytes(12).toString('hex');

    // Return file information with unique ID
    const fileInfo = {
      id: imageId,
      url: `/api/upload/image/${req.file.filename}`,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
      uploadedAt: new Date().toISOString()
    };

    res.status(200).json({
      message: 'Image uploaded successfully',
      file: fileInfo
    });

  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({
      message: 'Failed to upload image',
      error: 'UPLOAD_ERROR'
    });
  }
});

// Upload avatar endpoint
router.post('/avatar', authenticateToken, avatarUpload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'No avatar file provided',
        error: 'NO_FILE'
      });
    }

    // Get the avatar URL
    const avatarUrl = `/api/upload/avatar/${req.file.filename}`;
    
    // Update the user's avatar in the database
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }
    
    // Save the old avatar filename to delete it later if needed
    const oldAvatar = user.avatar;
    
    // Update user with new avatar
    user.avatar = avatarUrl;
    await user.save();

    // Delete old avatar file if it exists
    if (oldAvatar) {
      try {
        // Extract filename from the old avatar URL
        const oldFilename = oldAvatar.split('/').pop();
        const oldAvatarPath = path.join(__dirname, '../uploads/avatars', oldFilename);
        
        // Check if file exists before attempting to delete
        fs.access(oldAvatarPath, fs.constants.F_OK, (err) => {
          if (!err) {
            // File exists, delete it
            fs.unlink(oldAvatarPath, (err) => {
              if (err) {
                console.error('Error deleting old avatar file:', err);
                // Continue even if deletion fails
              } else {
                console.log('Successfully deleted old avatar file:', oldFilename);
              }
            });
          }
        });
      } catch (error) {
        console.error('Error during old avatar cleanup:', error);
        // Continue even if cleanup fails
      }
    }

    // Return success with updated user data
    res.status(200).json({
      message: 'Avatar uploaded successfully',
      user: user.getSafeProfile(),
      avatar: {
        url: avatarUrl,
        filename: req.file.filename
      }
    });

  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({
      message: 'Failed to upload avatar',
      error: 'AVATAR_UPLOAD_ERROR'
    });
  }
});

// Serve uploaded images with proper CORS headers
router.get('/image/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const imagePath = path.join(__dirname, '../uploads/images', filename);

    // Set CORS headers
    res.header('Access-Control-Allow-Origin', process.env.CLIENT_URL || 'http://localhost:5173');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');

    // Check if file exists and serve it
    res.sendFile(imagePath, (err) => {
      if (err) {
        console.error('Error serving image:', err);
        res.status(404).json({
          message: 'Image not found',
          error: 'IMAGE_NOT_FOUND'
        });
      }
    });
  } catch (error) {
    console.error('Image serving error:', error);
    res.status(500).json({
      message: 'Failed to serve image',
      error: 'IMAGE_SERVE_ERROR'
    });
  }
});

// Serve avatar images
router.get('/avatar/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const avatarPath = path.join(__dirname, '../uploads/avatars', filename);

    // Set CORS headers
    res.header('Access-Control-Allow-Origin', process.env.CLIENT_URL || 'http://localhost:5173');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');

    // Check if file exists and serve it
    res.sendFile(avatarPath, (err) => {
      if (err) {
        console.error('Error serving avatar:', err);
        res.status(404).json({
          message: 'Avatar not found',
          error: 'AVATAR_NOT_FOUND'
        });
      }
    });
  } catch (error) {
    console.error('Avatar serving error:', error);
    res.status(500).json({
      message: 'Failed to serve avatar',
      error: 'AVATAR_SERVE_ERROR'
    });
  }
});

// Delete image endpoint
router.delete('/image/:filename', authenticateToken, (req, res) => {
  try {
    const filename = req.params.filename;
    const imagePath = path.join(__dirname, '../uploads/images', filename);

    // Check if file exists
    fs.access(imagePath, fs.constants.F_OK, (err) => {
      if (err) {
        return res.status(404).json({
          message: 'Image not found',
          error: 'IMAGE_NOT_FOUND'
        });
      }

      // Delete file
      fs.unlink(imagePath, (err) => {
        if (err) {
          console.error('Error deleting image:', err);
          return res.status(500).json({
            message: 'Failed to delete image',
            error: 'DELETE_ERROR'
          });
        }

        res.status(200).json({
          message: 'Image deleted successfully'
        });
      });
    });
  } catch (error) {
    console.error('Image deletion error:', error);
    res.status(500).json({
      message: 'Failed to delete image',
      error: 'DELETE_ERROR'
    });
  }
});

// Delete avatar endpoint
router.delete('/avatar', authenticateToken, async (req, res) => {
  try {
    // Get user
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    // If user has no avatar, return success
    if (!user.avatar) {
      return res.status(200).json({
        message: 'No avatar to delete'
      });
    }

    // Extract filename from avatar URL
    const avatarUrl = user.avatar;
    const filename = path.basename(avatarUrl);
    const avatarPath = path.join(__dirname, '../uploads/avatars', filename);

    // Delete file if it exists
    fs.access(avatarPath, fs.constants.F_OK, async (err) => {
      // Remove avatar from user profile regardless of file existence
      user.avatar = null;
      await user.save();

      if (err) {
        // File doesn't exist, but we updated the user profile
        return res.status(200).json({
          message: 'Avatar removed from profile',
          user: user.getSafeProfile()
        });
      }

      // Delete the file
      fs.unlink(avatarPath, (err) => {
        if (err) {
          console.error('Error deleting avatar file:', err);
          // Still return success as we've updated the user profile
          return res.status(200).json({
            message: 'Avatar removed from profile but file deletion failed',
            user: user.getSafeProfile()
          });
        }

        res.status(200).json({
          message: 'Avatar deleted successfully',
          user: user.getSafeProfile()
        });
      });
    });
  } catch (error) {
    console.error('Avatar deletion error:', error);
    res.status(500).json({
      message: 'Failed to delete avatar',
      error: 'DELETE_ERROR'
    });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'File too large. Maximum size is 5MB',
        error: 'FILE_TOO_LARGE'
      });
    }
  }
  
  if (error.message.includes('Only image files')) {
    return res.status(400).json({
      message: error.message,
      error: 'INVALID_FILE_TYPE'
    });
  }

  res.status(500).json({
    message: 'Upload failed',
    error: 'UPLOAD_ERROR'
  });
});

export default router;
