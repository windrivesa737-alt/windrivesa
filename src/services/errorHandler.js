/**
 * Sanitized Service Error Handler for WinDriveSA
 *
 * Prevents exposure of internal database schemas, raw SQL statements,
 * stack traces, constraint names, or sensitive infrastructure details.
 */

export function sanitizeDbError(error, fallbackMessage = 'An unexpected error occurred. Please try again.') {
  if (!error) return { message: fallbackMessage };

  // If already sanitized or a standard string
  if (typeof error === 'string') {
    return { message: error };
  }

  const code = error.code || '';
  const rawMessage = (error.message || '').toLowerCase();

  // Handle common Postgres / PostgREST error codes gracefully
  if (code === 'PGRST116' || rawMessage.includes('0 rows') || rawMessage.includes('not found')) {
    return {
      message: 'The requested record could not be found.',
      code: 'NOT_FOUND',
    };
  }

  if (code === '42501' || rawMessage.includes('permission denied') || rawMessage.includes('policy')) {
    return {
      message: 'You do not have permission to perform this action.',
      code: 'FORBIDDEN',
    };
  }

  if (code === '23505' || rawMessage.includes('duplicate key') || rawMessage.includes('already exists')) {
    return {
      message: 'A record with these details already exists.',
      code: 'DUPLICATE_RECORD',
    };
  }

  if (code === '23503' || rawMessage.includes('foreign key')) {
    return {
      message: 'Referenced record was not found or has been removed.',
      code: 'INVALID_REFERENCE',
    };
  }

  if (code === '23514' || rawMessage.includes('check constraint')) {
    return {
      message: 'The provided values do not meet system validation criteria.',
      code: 'VALIDATION_FAILED',
    };
  }

  // Network / connection issues
  if (rawMessage.includes('failed to fetch') || rawMessage.includes('network')) {
    return {
      message: 'Unable to reach the server. Please check your internet connection.',
      code: 'NETWORK_ERROR',
    };
  }

  // Fallback to safe message
  return {
    message: fallbackMessage,
    code: code || 'UNKNOWN_ERROR',
  };
}
