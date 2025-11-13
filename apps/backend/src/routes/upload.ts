import { Router } from 'express';
import multer from 'multer';
import { validateUpload } from '../utils/validation';
import { fileUpload } from '../middleware/file-upload';

const router = Router();
const upload = multer({ 
  storage: fileUpload.storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

router.post(
  '/upload',
  upload.single('file'),
  validateUpload,
  async (req, res) => {
    try {
      // File is already validated at this point
      const file = req.file!;
      
      // Process the file...
      res.status(200).json({ 
        success: true, 
        message: 'File uploaded successfully',
        file: {
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path
        }
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to process file upload' 
      });
    }
  }
);

export default router;
