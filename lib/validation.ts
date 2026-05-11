/**
 * Input validation and sanitization utilities
 *
 * All user inputs must be validated and sanitized before:
 * - Sending to APIs
 * - Storing in database
 * - Using in queries
 */

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;

  // Basic email regex - allows most valid emails
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates password strength
 * Requirements: min 8 chars, at least 1 letter, at least 1 number
 */
export function isValidPassword(password: string): boolean {
  if (!password || typeof password !== 'string') return false;
  if (password.length < 8) return false;

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  return hasLetter && hasNumber;
}

/**
 * Validates name input
 * - 1-100 characters
 * - Letters, spaces, hyphens, apostrophes only
 * - No leading/trailing whitespace
 */
export function isValidName(name: string): boolean {
  if (!name || typeof name !== 'string') return false;

  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 100) return false;

  // Only allow letters (including unicode), spaces, hyphens, apostrophes
  const nameRegex = /^[\p{L}\s\-']+$/u;
  return nameRegex.test(trimmed);
}

/**
 * Sanitizes name - removes dangerous characters and trims
 */
export function sanitizeName(name: string): string {
  if (!name || typeof name !== 'string') return '';

  // Remove any characters that aren't letters, spaces, hyphens, apostrophes
  const sanitized = name.trim().replace(/[^\p{L}\s\-']/gu, '');

  // Collapse multiple spaces
  return sanitized.replace(/\s+/g, ' ').trim();
}

/**
 * Sanitizes email - lowercases and trims
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

/**
 * Validates image URI is from safe source (file:// or content://)
 */
export function isSafeImageUri(uri: string): boolean {
  if (!uri || typeof uri !== 'string') return false;

  const allowedSchemes = ['file://', 'content://'];
  const hasAllowedScheme = allowedSchemes.some(scheme => uri.startsWith(scheme));

  // Check for path traversal attempts
  const hasTraversal = uri.includes('..') || uri.includes('%2e%2e');

  return hasAllowedScheme && !hasTraversal;
}

/**
 * Validates URL is HTTPS (for external links)
 */
export function isSafeExternalUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('https://');
}

/**
 * Strips HTML/script tags from input
 */
export function stripHtmlTags(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/<[^>]*>/g, '').trim();
}

/**
 * Validates a generic string is not empty and within length bounds
 */
export function isValidString(input: string, minLength = 1, maxLength = 1000): boolean {
  if (!input || typeof input !== 'string') return false;
  const trimmed = input.trim();
  return trimmed.length >= minLength && trimmed.length <= maxLength;
}

/**
 * Sanitizes any string input - generic cleanup
 */
export function sanitizeString(input: string, maxLength = 1000): string {
  if (!input || typeof input !== 'string') return '';

  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters
}

/**
 * Validation result type
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Creates a validation result
 */
export function validationResult(valid: boolean, error?: string): ValidationResult {
  return { valid, error };
}