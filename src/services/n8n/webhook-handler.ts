/**
 * n8n Webhook Handler Base Service
 * 
 * Provides base functionality for webhook request validation,
 * authentication, error handling, and logging.
 */

import type { NextRequest } from 'next/server';
import type {
  MasterWebhookRequest,
  WebhookAction,
} from '../../types/n8n';

/**
 * Error codes for webhook responses
 */
export enum WebhookErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  API_ERROR = 'API_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
}

/**
 * Standardized error response format
 */
export interface WebhookErrorResponse {
  success: false;
  error: string;
  code: WebhookErrorCode;
  details?: unknown;
}

/**
 * Validates that the request has a valid action field
 */
export function validateWebhookAction(
  body: unknown,
): body is { action: string } {
  if (!body || typeof body !== 'object') {
    return false;
  }
  const request = body as Record<string, unknown>;
  return typeof request.action === 'string' && request.action.length > 0;
}

/**
 * Validates that the action is one of the allowed actions
 */
export function isValidAction(action: string): action is WebhookAction {
  return Object.values(WebhookAction).includes(action as WebhookAction);
}

/**
 * Validates the complete webhook request structure
 */
export function validateMasterWebhookRequest(
  body: unknown,
): body is MasterWebhookRequest {
  if (!validateWebhookAction(body)) {
    return false;
  }

  const request = body as { action: string; [key: string]: unknown };

  switch (request.action) {
    case WebhookAction.COMPANY_RESEARCH:
      return (
        typeof request.companyId === 'string' && request.companyId.length > 0
      );

    case WebhookAction.SCRAPE_REFERENCE_POST:
      return (
        typeof request.companyId === 'string' &&
        request.companyId.length > 0 &&
        typeof request.linkedinUrl === 'string' &&
        request.linkedinUrl.length > 0
      );

    case WebhookAction.GENERATE_CONTENT:
      return (
        typeof request.generatedPostId === 'string' &&
        request.generatedPostId.length > 0
      );

    default:
      return false;
  }
}

/**
 * Validates webhook authentication (optional secret validation)
 */
export function validateWebhookAuthentication(
  request: NextRequest,
  secret?: string,
): boolean {
  if (!secret) {
    // No secret configured, allow all requests
    return true;
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return false;
  }

  // Support both "Bearer token" and direct secret in header
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : authHeader;

  return token === secret;
}

/**
 * Creates a standardized validation error response
 */
export function createValidationErrorResponse(
  message: string,
  details?: unknown,
): WebhookErrorResponse {
  return {
    success: false,
    error: message,
    code: WebhookErrorCode.VALIDATION_ERROR,
    details,
  };
}

/**
 * Creates a standardized not found error response
 */
export function createNotFoundErrorResponse(
  resource: string,
  id?: string,
): WebhookErrorResponse {
  const message = id
    ? `${resource} with ID ${id} not found`
    : `${resource} not found`;
  return {
    success: false,
    error: message,
    code: WebhookErrorCode.NOT_FOUND,
    details: { resource, id },
  };
}

/**
 * Creates a standardized API error response
 */
export function createAPIErrorResponse(
  message: string,
  details?: unknown,
): WebhookErrorResponse {
  return {
    success: false,
    error: message,
    code: WebhookErrorCode.API_ERROR,
    details,
  };
}

/**
 * Creates a standardized unauthorized error response
 */
export function createUnauthorizedErrorResponse(
  message: string = 'Unauthorized',
): WebhookErrorResponse {
  return {
    success: false,
    error: message,
    code: WebhookErrorCode.UNAUTHORIZED,
  };
}

