import { Response } from 'express';
import { HTTP_CODES } from '../config/constants';

export const successResponse = (res: Response, data: any, status: number = HTTP_CODES.OK, meta?: any) => {
  return res.status(status).json({
    ok: true,
    data,
    ...(meta && { meta })
  });
};

export const errorResponse = (res: Response, message: string, status: number = HTTP_CODES.INTERNAL_SERVER_ERROR, details?: any) => {
  return res.status(status).json({
    ok: false,
    error: message,
    ...(details && { details })
  });
};

export const paginatedResponse = (res: Response, data: any[], page: number, limit: number, total: number) => {
  return successResponse(res, data, HTTP_CODES.OK, {
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
};
