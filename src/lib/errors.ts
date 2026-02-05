/**
 * Error Utilities
 * @description Standardized error classes and handlers for consistent error management
 */

// =============================================================================
// CUSTOM ERROR CLASSES
// =============================================================================

/**
 * Base application error with status code and error code
 */
export class AppError extends Error {
    constructor(
        message: string,
        public code: string,
        public statusCode: number = 500,
        public details?: unknown
    ) {
        super(message);
        this.name = 'AppError';
        // Maintains proper stack trace for where error was thrown
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, AppError);
        }
    }
}

/**
 * Validation error (400 Bad Request)
 */
export class ValidationError extends AppError {
    constructor(message: string, details?: unknown) {
        super(message, 'VALIDATION_ERROR', 400, details);
        this.name = 'ValidationError';
    }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends AppError {
    constructor(resource: string) {
        super(`${resource} not found`, 'NOT_FOUND', 404);
        this.name = 'NotFoundError';
    }
}

/**
 * Unauthorized error (401)
 */
export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized') {
        super(message, 'UNAUTHORIZED', 401);
        this.name = 'UnauthorizedError';
    }
}

/**
 * Forbidden error (403)
 */
export class ForbiddenError extends AppError {
    constructor(message: string = 'Forbidden') {
        super(message, 'FORBIDDEN', 403);
        this.name = 'ForbiddenError';
    }
}

/**
 * Conflict error (409) - for things like duplicate entries or state conflicts
 */
export class ConflictError extends AppError {
    constructor(message: string, details?: unknown) {
        super(message, 'CONFLICT', 409, details);
        this.name = 'ConflictError';
    }
}

/**
 * Database error with wrapped original error
 */
export class DatabaseError extends AppError {
    constructor(message: string, originalError?: unknown) {
        super(message, 'DATABASE_ERROR', 500, originalError);
        this.name = 'DatabaseError';
    }
}

// =============================================================================
// ERROR HANDLING UTILITIES
// =============================================================================

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
    return error instanceof AppError;
}

/**
 * Extract error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    return 'An unknown error occurred';
}

/**
 * Handle API route errors and return appropriate Response
 * For use in Next.js API routes
 */
export function handleApiError(error: unknown): Response {
    console.error('API Error:', error);

    if (isAppError(error)) {
        return Response.json(
            {
                error: error.message,
                code: error.code,
                details: error.details,
            },
            { status: error.statusCode }
        );
    }

    // Handle Supabase errors
    if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
        const supabaseError = error as { code: string; message: string };
        return Response.json(
            {
                error: supabaseError.message,
                code: supabaseError.code,
            },
            { status: 500 }
        );
    }

    // Generic error response
    return Response.json(
        {
            error: getErrorMessage(error),
            code: 'INTERNAL_ERROR',
        },
        { status: 500 }
    );
}

/**
 * Wrap an async function with error handling
 * Useful for service functions
 */
export function withErrorHandling<T extends (...args: Parameters<T>) => Promise<ReturnType<T>>>(
    fn: T,
    errorMessage: string
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
    return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
        try {
            return await fn(...args);
        } catch (error) {
            console.error(`${errorMessage}:`, error);
            if (isAppError(error)) {
                throw error;
            }
            throw new AppError(
                errorMessage,
                'OPERATION_FAILED',
                500,
                error instanceof Error ? error.message : undefined
            );
        }
    };
}

// =============================================================================
// RESULT TYPE PATTERN
// =============================================================================

/**
 * Result type for operations that can fail
 * Alternative to throwing exceptions
 */
export type Result<T, E = string> =
    | { success: true; data: T }
    | { success: false; error: E };

/**
 * Create a success result
 */
export function ok<T>(data: T): Result<T, never> {
    return { success: true, data };
}

/**
 * Create a failure result
 */
export function err<E>(error: E): Result<never, E> {
    return { success: false, error };
}

/**
 * Check if result is successful
 */
export function isOk<T, E>(result: Result<T, E>): result is { success: true; data: T } {
    return result.success;
}

/**
 * Check if result is an error
 */
export function isErr<T, E>(result: Result<T, E>): result is { success: false; error: E } {
    return !result.success;
}
