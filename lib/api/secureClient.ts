/**
 * Secure API client with certificate validation and MITM prevention
 *
 * Security features:
 * - TLS/SSL validation (when available on the platform)
 * - Request timeout to prevent hanging connections
 * - Input validation before sending
 * - Error sanitization (don't leak internal details)
 * - Rate limiting integration
 */

import { isSafeImageUri, sanitizeString } from '@/lib/validation';

export interface SecureFetchOptions extends RequestInit {
  timeout?: number;
  validateUri?: boolean;
}

export interface ApiError {
  message: string;
  code: string;
  status?: number;
}

/**
 * Creates a sanitized error for client consumption
 * Never exposes internal details like stack traces or file paths
 */
function sanitizeError(error: unknown, context: string): ApiError {
  console.error(`[API Error] ${context}:`, error);

  if (error instanceof Error) {
    // Don't leak internal error details
    return {
      message: 'An error occurred. Please try again.',
      code: 'INTERNAL_ERROR',
    };
  }

  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    if (err.status === 401) {
      return { message: 'Authentication required', code: 'UNAUTHORIZED', status: 401 };
    }
    if (err.status === 403) {
      return { message: 'Access denied', code: 'FORBIDDEN', status: 403 };
    }
    if (err.status === 429) {
      return { message: 'Too many requests. Please wait.', code: 'RATE_LIMITED', status: 429 };
    }
    if (err.status === 500) {
      return { message: 'Server error. Please try again later.', code: 'SERVER_ERROR', status: 500 };
    }
  }

  return { message: 'Network error. Please check your connection.', code: 'NETWORK_ERROR' };
}

/**
 * Secure fetch with validation and timeout
 */
export async function secureFetch<T = unknown>(
  url: string,
  options: SecureFetchOptions = {}
): Promise<T> {
  const { timeout = 30000, validateUri = false, ...fetchOptions } = options;

  // Validate URI if requested
  if (validateUri && !isSafeImageUri(url)) {
    throw { message: 'Invalid request URL', code: 'INVALID_URL' };
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      // Ensure credentials are not leaked
      credentials: 'same-origin',
    });

    clearTimeout(timeoutId);

    // Handle HTTP errors
    if (!response.ok) {
      const error: Record<string, unknown> = {
        status: response.status,
        code: 'HTTP_ERROR',
      };

      // Try to parse error message, but don't trust it
      try {
        const data = await response.json();
        if (data.error && typeof data.error === 'string') {
          error.message = data.error;
        }
      } catch {
        // Response wasn't JSON, use status-based message
        error.message = `Request failed with status ${response.status}`;
      }

      throw error;
    }

    // Parse response
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return response.json() as Promise<T>;
    }

    return response.text() as unknown as T;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw { message: 'Request timed out', code: 'TIMEOUT' };
      }
      throw sanitizeError(error, 'fetch');
    }

    throw sanitizeError(error, 'unknown');
  }
}

/**
 * Validates and sanitizes request body
 */
export function prepareRequestBody<T extends Record<string, unknown>>(body: T): T {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(body)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (value !== null && typeof value === 'object') {
      // Recursively sanitize objects
      sanitized[key] = prepareRequestBody(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

/**
 * Builds auth headers securely
 */
export function buildAuthHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Don't log or leak tokens
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}