# EcoPoints API Documentation

## Overview
This Flask backend provides two main API groups:
- **Web API** (`/api/web`): For the Next.js frontend web application
- **RPI API** (`/api/rpi`): For the Raspberry Pi 5 hardware (Reverse Vending Machine)

## Base URL
```
http://127.0.0.1:5000
```

## API Endpoints

### Root Endpoints

#### `GET /`
Returns API information and available endpoints.

#### `GET /health`
Global health check endpoint.

---

### Web Application API (`/api/web`)

#### `GET /api/web/health`
Web API health check.

**Response:**
```json
{
  "success": true,
  "message": "Web API is running",
  "status": "healthy"
}
```

#### `GET /api/web/users`
Get all users.

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "created_at": "2025-12-18T10:30:00"
    }
  ]
}
```

#### `GET /api/web/users/<user_id>`
Get specific user by ID.

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "John Doe",
    "created_at": "2025-12-18T10:30:00"
  }
}
```

#### `POST /api/web/users`
Create a new user.

**Request Body:**
```json
{
  "name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "John Doe",
    "created_at": "2025-12-18T10:30:00"
  }
}
```

---

### Raspberry Pi API (`/api/rpi`)

#### `GET /api/rpi/health`
RPI API health check.

**Response:**
```json
{
  "success": true,
  "message": "RPI API is running",
  "status": "healthy"
}
```

#### `GET /api/rpi/status`
Get Raspberry Pi system status.

**Response:**
```json
{
  "success": true,
  "status": "online",
  "timestamp": "2025-12-18T10:30:00",
  "message": "RVM is operational"
}
```

#### `POST /api/rpi/authenticate`
Authenticate user via QR code scan.

**Request Body:**
```json
{
  "qr_code": "USER_QR_12345"
}
```

**Response:**
```json
{
  "success": true,
  "authenticated": true,
  "user": {
    "id": 1,
    "name": "Example User",
    "qr_code": "USER_QR_12345"
  }
}
```

#### `POST /api/rpi/scan`
Handle bottle scan from Raspberry Pi.

**Request Body:**
```json
{
  "bottle_type": "plastic",
  "qr_code": "USER_QR_12345",
  "timestamp": "2025-12-18T10:30:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Scan processed successfully",
  "data": {
    "bottle_type": "plastic",
    "qr_code": "USER_QR_12345",
    "timestamp": "2025-12-18T10:30:00Z",
    "points_awarded": 10
  }
}
```

#### `POST /api/rpi/log`
Log event from Raspberry Pi.

**Request Body:**
```json
{
  "event_type": "bottle_detected",
  "message": "Bottle detected in sensor"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Log recorded"
}
```

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `404`: Not Found
- `500`: Internal Server Error

---

## Testing

Use the `api-tests.http` file with REST Client extension in VS Code to test all endpoints.

## CORS Configuration

Make sure to configure CORS properly in production to allow requests from:
- Next.js frontend (http://localhost:3000)
- Raspberry Pi device IP

## Next Steps

1. Implement authentication/authorization
2. Add database models for transactions and points
3. Implement QR code generation and validation
4. Add logging to database
5. Implement points awarding system
6. Add user profiles and rewards system
