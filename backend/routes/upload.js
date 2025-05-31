import { randomBytes } from 'crypto';
import express from 'express';
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
