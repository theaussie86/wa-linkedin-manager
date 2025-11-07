/**
 * Base API client with authentication and error handling
 */

export interface ApiError {
  message: string
  status?: number
  errors?: Record<string, string[]>
}

export class ApiClientError extends Error {
  status?: number
  errors?: Record<string, string[]>

  constructor(message: string, status?: number, errors?: Record<string, string[]>) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
    this.errors = errors
  }
}

/**
 * Gets authentication headers for API requests
 */
export function getAuthHeaders(): HeadersInit {
  // In a real implementation, this would get the auth token from cookies or localStorage
  // For Payload CMS, we typically use cookies for authentication
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  return headers
}

/**
 * Handles API response and throws ApiClientError on error
 */
export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `API Error: ${response.status} ${response.statusText}`
    let errors: Record<string, string[]> | undefined

    try {
      const errorData = await response.json()
      if (errorData.message) {
        errorMessage = errorData.message
      }
      if (errorData.errors) {
        errors = errorData.errors
      }
    } catch {
      // If response is not JSON, use status text
      errorMessage = `API Error: ${response.status} ${response.statusText}`
    }

    throw new ApiClientError(errorMessage, response.status, errors)
  }

  // Handle empty responses
  const contentType = response.headers.get('content-type')
  if (!contentType || !contentType.includes('application/json')) {
    return {} as T
  }

  return response.json()
}

/**
 * Makes an authenticated API request
 */
export async function apiRequest<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Include cookies for authentication
  })

  return handleApiResponse<T>(response)
}

/**
 * Makes a GET request
 */
export async function apiGet<T>(url: string, options: RequestInit = {}): Promise<T> {
  return apiRequest<T>(url, {
    ...options,
    method: 'GET',
  })
}

/**
 * Makes a POST request
 */
export async function apiPost<T>(url: string, data?: unknown, options: RequestInit = {}): Promise<T> {
  return apiRequest<T>(url, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * Makes a PUT request
 */
export async function apiPut<T>(url: string, data?: unknown, options: RequestInit = {}): Promise<T> {
  return apiRequest<T>(url, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * Makes a DELETE request
 */
export async function apiDelete<T>(url: string, options: RequestInit = {}): Promise<T> {
  return apiRequest<T>(url, {
    ...options,
    method: 'DELETE',
  })
}

