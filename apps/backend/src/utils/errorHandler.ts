export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const createError = (message: string, statusCode: number = 500) => {
  return new AppError(message, statusCode);
};

export const handleError = (error: Error, context?: string) => {
  console.error(`Error${context ? ` in ${context}` : ''}:`, error);
  return error;
};

export const logError = (error: Error, context?: string) => {
  console.error(`Error${context ? ` in ${context}` : ''}:`, error);
  return error;
};
