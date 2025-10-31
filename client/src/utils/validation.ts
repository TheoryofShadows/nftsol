// Validation utilities for the frontend

export const validateWalletAddress = (address: string): boolean => {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type);
};

export const validateFileSize = (file: File, maxSizeInMB: number): boolean => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
};

export const validateNFTName = (name: string): { valid: boolean; error?: string } => {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'NFT name is required' };
  }

  if (name.length > 100) {
    return { valid: false, error: 'NFT name must be less than 100 characters' };
  }

  if (name.length < 2) {
    return { valid: false, error: 'NFT name must be at least 2 characters' };
  }

  return { valid: true };
};

export const validateNFTDescription = (description: string): { valid: boolean; error?: string } => {
  if (description && description.length > 1000) {
    return { valid: false, error: 'Description must be less than 1000 characters' };
  }

  return { valid: true };
};

export const validateMintRequest = (request: {
  name: string;
  description?: string;
  creatorWallet: string;
  file?: File;
}): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Validate name
  const nameValidation = validateNFTName(request.name);
  if (!nameValidation.valid) {
    errors.push(nameValidation.error!);
  }

  // Validate description
  if (request.description) {
    const descValidation = validateNFTDescription(request.description);
    if (!descValidation.valid) {
      errors.push(descValidation.error!);
    }
  }

  // Validate wallet
  if (!validateWalletAddress(request.creatorWallet)) {
    errors.push('Invalid wallet address format');
  }

  // Validate file if provided
  if (request.file) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validateFileType(request.file, allowedTypes)) {
      errors.push(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
    }

    if (!validateFileSize(request.file, 10)) {
      errors.push('File size must be less than 10MB');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/[^\w\s\-.,!?]/g, ''); // Remove special characters except basic punctuation
};

export const formatWalletAddress = (address: string, startChars = 4, endChars = 4): string => {
  if (address.length <= startChars + endChars) {
    return address;
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

export const formatSOL = (lamports: number): string => {
  return (lamports / 1e9).toFixed(4);
};

export const formatNumber = (num: number, decimals = 2): string => {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};
