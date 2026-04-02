// Form Validation Utilities

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
  message: string;
}

export interface ValidationRules {
  [key: string]: ValidationRule[];
}

export interface ValidationErrors {
  [key: string]: string;
}

// Common validation patterns
export const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  ethiopianPhone: /^\+251[79]\d{8}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  alphabetic: /^[a-zA-Z\s]+$/,
  numeric: /^\d+$/,
  url: /^https?:\/\/.+/,
};

// Validation rules for common fields
export const commonRules = {
  email: [
    { required: true, message: 'Email is required' },
    { pattern: patterns.email, message: 'Please enter a valid email address' },
  ],
  phone: [
    { required: true, message: 'Phone number is required' },
    { pattern: patterns.ethiopianPhone, message: 'Please enter a valid Ethiopian phone number (+251XXXXXXXXX)' },
  ],
  password: [
    { required: true, message: 'Password is required' },
    { minLength: 8, message: 'Password must be at least 8 characters' },
    { pattern: patterns.password, message: 'Password must contain uppercase, lowercase, number, and special character' },
  ],
  name: [
    { required: true, message: 'Name is required' },
    { minLength: 2, message: 'Name must be at least 2 characters' },
    { maxLength: 50, message: 'Name must not exceed 50 characters' },
    { pattern: patterns.alphabetic, message: 'Name can only contain letters and spaces' },
  ],
  amount: [
    { required: true, message: 'Amount is required' },
    { pattern: patterns.numeric, message: 'Amount must be a number' },
    { custom: (value: any) => parseFloat(value) > 0, message: 'Amount must be greater than 0' },
  ],
};

// Validate a single field
export function validateField(value: any, rules: ValidationRule[]): string | null {
  for (const rule of rules) {
    // Required check
    if (rule.required && (!value || value.toString().trim() === '')) {
      return rule.message;
    }

    // Skip other checks if value is empty and not required
    if (!value || value.toString().trim() === '') {
      continue;
    }

    // Min length check
    if (rule.minLength && value.toString().length < rule.minLength) {
      return rule.message;
    }

    // Max length check
    if (rule.maxLength && value.toString().length > rule.maxLength) {
      return rule.message;
    }

    // Pattern check
    if (rule.pattern && !rule.pattern.test(value.toString())) {
      return rule.message;
    }

    // Custom validation
    if (rule.custom && !rule.custom(value)) {
      return rule.message;
    }
  }

  return null;
}

// Validate entire form
export function validateForm(data: any, rules: ValidationRules): ValidationErrors {
  const errors: ValidationErrors = {};

  for (const [field, fieldRules] of Object.entries(rules)) {
    const error = validateField(data[field], fieldRules);
    if (error) {
      errors[field] = error;
    }
  }

  return errors;
}

// Check if form has errors
export function hasErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}

// Sanitize user input to prevent XSS
export function sanitizeInput(input: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  const reg = /[&<>"'/]/gi;
  return input.replace(reg, (match) => map[match]);
}

// Validate Ethiopian Birr amount
export function validateBirrAmount(amount: number, min: number = 0, max?: number): string | null {
  if (isNaN(amount)) {
    return 'Please enter a valid amount';
  }
  if (amount < min) {
    return `Amount must be at least ${min.toLocaleString()} ETB`;
  }
  if (max && amount > max) {
    return `Amount must not exceed ${max.toLocaleString()} ETB`;
  }
  return null;
}

// Validate bid amount
export function validateBidAmount(
  bidAmount: number,
  currentBid: number,
  minIncrement: number
): string | null {
  const minBid = currentBid + minIncrement;
  
  if (isNaN(bidAmount)) {
    return 'Please enter a valid bid amount';
  }
  
  if (bidAmount < minBid) {
    return `Minimum bid is ${minBid.toLocaleString()} ETB`;
  }
  
  return null;
}

// Validate file upload
export function validateFile(
  file: File,
  options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
  } = {}
): string | null {
  const { maxSize = 5 * 1024 * 1024, allowedTypes = ['image/jpeg', 'image/png', 'image/webp'] } = options;

  if (file.size > maxSize) {
    return `File size must not exceed ${(maxSize / (1024 * 1024)).toFixed(1)}MB`;
  }

  if (!allowedTypes.includes(file.type)) {
    return `File type must be one of: ${allowedTypes.map(t => t.split('/')[1]).join(', ')}`;
  }

  return null;
}

// Password strength checker
export function checkPasswordStrength(password: string): {
  strength: 'weak' | 'medium' | 'strong';
  score: number;
  feedback: string[];
} {
  let score = 0;
  const feedback: string[] = [];

  if (password.length >= 8) score++;
  else feedback.push('Use at least 8 characters');

  if (password.length >= 12) score++;

  if (/[a-z]/.test(password)) score++;
  else feedback.push('Include lowercase letters');

  if (/[A-Z]/.test(password)) score++;
  else feedback.push('Include uppercase letters');

  if (/\d/.test(password)) score++;
  else feedback.push('Include numbers');

  if (/[@$!%*?&]/.test(password)) score++;
  else feedback.push('Include special characters');

  let strength: 'weak' | 'medium' | 'strong';
  if (score <= 2) strength = 'weak';
  else if (score <= 4) strength = 'medium';
  else strength = 'strong';

  return { strength, score, feedback };
}

// Debounce function for async validation
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}