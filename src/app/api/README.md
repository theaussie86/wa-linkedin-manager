# API Documentation

## Overview

This API provides REST endpoints for managing LinkedIn Content Management System data. The API uses Payload CMS for automatic CRUD operations and includes custom endpoints for special operations.

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://api.wa-linkedin-manager.com/api`

## Authentication

All API requests require authentication via Bearer token:

```
Authorization: Bearer <token>
```

## Rate Limiting

API requests are rate-limited:
- **Standard**: 100 requests per minute
- **Strict**: 10 requests per minute (for sensitive operations)

Rate limit information is provided in response headers:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in window
- `X-RateLimit-Reset`: Timestamp when limit resets

## Error Responses

All errors follow a standardized format:

```json
{
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE",
    "details": {},
    "timestamp": "2025-01-27T12:00:00.000Z",
    "path": "/api/companies/123"
  }
}
```

### Error Codes

- `BAD_REQUEST` (400): Invalid request data
- `UNAUTHORIZED` (401): Authentication required
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `CONFLICT` (409): Resource conflict
- `UNPROCESSABLE_ENTITY` (422): Validation failed
- `TOO_MANY_REQUESTS` (429): Rate limit exceeded
- `INTERNAL_SERVER_ERROR` (500): Server error

## Payload CMS Auto-Generated Endpoints

Payload CMS automatically provides REST API endpoints for all collections:

### Collection Endpoints

For each collection (companies, reference-posts, generated-posts, users, campaigns, post-analytics):

#### List Resources
```
GET /api/{collection}
```

Query Parameters:
- `limit` (integer): Number of results per page (default: 10)
- `page` (integer): Page number (default: 1)
- `where` (JSON): Filter conditions
- `sort` (string): Sort field
- `depth` (integer): Relationship depth to include

#### Get Resource
```
GET /api/{collection}/{id}
```

#### Create Resource
```
POST /api/{collection}
Content-Type: application/json

{
  "field1": "value1",
  "field2": "value2"
}
```

#### Update Resource
```
PATCH /api/{collection}/{id}
Content-Type: application/json

{
  "field1": "updated_value"
}
```

#### Delete Resource
```
DELETE /api/{collection}/{id}
```

## Custom Endpoints

### Generated Posts

#### Generate AI Content
```
POST /api/generated-posts/{id}/generate
Content-Type: application/json

{
  "writingStyle": "story_based" | "insight_focused" | "engagement_focused",
  "referencePostId": "optional-reference-post-id"
}
```

#### Review Generated Post
```
POST /api/generated-posts/{id}/review
Content-Type: application/json

{
  "action": "approve" | "reject" | "request_changes",
  "comments": "Optional review comments"
}
```

## OpenAPI Specification

The complete OpenAPI 3.1 specification is available at:

```
GET /api/openapi
```

This endpoint returns the full API specification in JSON format, including:
- All endpoints
- Request/response schemas
- Authentication requirements
- Error responses

## Example Requests

### Create Company
```bash
curl -X POST http://localhost:3000/api/companies \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Example Corp",
    "industry": "Technology",
    "size": "medium",
    "website": "https://example.com"
  }'
```

### List Reference Posts
```bash
curl -X GET "http://localhost:3000/api/reference-posts?limit=20&page=1" \
  -H "Authorization: Bearer <token>"
```

### Generate AI Content
```bash
curl -X POST http://localhost:3000/api/generated-posts/123/generate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "writingStyle": "story_based",
    "referencePostId": "456"
  }'
```

## Response Format

### Success Response
```json
{
  "data": {
    "id": "123",
    "field1": "value1",
    "field2": "value2"
  },
  "meta": {
    "message": "Optional success message"
  }
}
```

### Paginated Response
```json
{
  "docs": [
    {
      "id": "123",
      "field1": "value1"
    }
  ],
  "totalDocs": 100,
  "limit": 10,
  "page": 1,
  "totalPages": 10,
  "hasNextPage": true,
  "hasPrevPage": false
}
```

## Collections

### Companies (`/api/companies`)
- Manage company information
- Link to LinkedIn profiles
- Track research status

### Reference Posts (`/api/reference-posts`)
- Store LinkedIn reference posts
- Link to companies
- Track engagement metrics

### Generated Posts (`/api/generated-posts`)
- AI-generated content
- Review workflow
- Publishing status

### Users (`/api/users`)
- User management
- Role-based access
- Authentication

### Campaigns (`/api/campaigns`)
- Content campaigns
- Post scheduling
- Analytics tracking

### Post Analytics (`/api/post-analytics`)
- Performance metrics
- Engagement data
- Time-based aggregation

