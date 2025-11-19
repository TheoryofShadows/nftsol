import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { appConfig } from '../config';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';

// Ensure uploads directory exists
import fs from 'fs';
import { promisify } from 'util';

const mkdir = promisify(fs.mkdir);
const exists = promisify(fs.exists);

// Create uploads directory if it doesn't exist
const ensureUploadsDir = async () => {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!(await exists(uploadsDir))) {
    await mkdir(uploadsDir, { recursive: true });
  }
  return uploadsDir;
};

// Initialize storage with proper typing
const storage = multer.diskStorage({
  destination: async (req: Request, file: any, cb: (error: Error | null, destination: string) => void) => {
    try {
      const uploadsDir = await ensureUploadsDir();
      cb(null, uploadsDir);
    } catch (error) {
      cb(error as Error, '');
    }
  },
  filename: (req: Request, file: any, cb: (error: Error | null, filename: string) => void) => {
    try {
      const ext = path.extname(file.originalname);
      const filename = `${uuidv4()}${ext}`;
      cb(null, filename);
    } catch (error) {
      cb(error as Error, '');
    }
  }
});

// File filter with proper typing
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  try {
    if (appConfig.fileUpload.allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const error = new Error(`Invalid file type. Allowed types: ${appConfig.fileUpload.allowedTypes.join(', ')}`);
      cb(error);
    }
  } catch (error) {
    cb(error as Error);
  }
};

// Configure multer with type safety
const upload = multer({
  storage,
  limits: {
    fileSize: appConfig.fileUpload.maxSize,
    files: 5, // Maximum number of files
  },
  fileFilter,
});

// Export with proper typing
export interface MulterRequest extends Request {
  file?: Express.Multer.File;
  files?: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[];
}

export const fileUpload = {
  storage,
  upload,
  single: upload.single('file'),
  array: upload.array('files'),
  fields: upload.fields,
};
