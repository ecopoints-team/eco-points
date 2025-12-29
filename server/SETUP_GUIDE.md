# EcoPoints Backend Setup & Testing Guide

## Project Structure

```
server/
├── app/
│   ├── __init__.py           # Flask app initialization with CORS and blueprints
│   ├── models.py             # Database models
│   ├── routes.py             # Main routes (root endpoints)
│   └── controllers/          # Organized API controllers
│       ├── __init__.py
│       ├── web_controller.py     # Web application API endpoints
│       └── rpi_controller.py     # Raspberry Pi 5 API endpoints
├── migrations/               # Database migrations
├── run.py                    # Application entry point
├── requirements.txt          # Python dependencies
├── api-tests.http           # REST Client test file
└── API_DOCUMENTATION.md     # Complete API documentation
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd server
pip install -r requirements.txt
```

### 2. Configure Environment

Create `.env` file:
```
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/ecopoints
SECRET_KEY=your-secret-key-here
FLASK_APP=run.py
FLASK_ENV=development
```

### 3. Initialize Database

```bash
flask db init
flask db migrate -m "Initial migration"
flask db upgrade
```

### 4. Run the Server

```bash
python run.py
```

Server will start on `http://127.0.0.1:5000`

## API Endpoints

### Two Main API Groups

1. **Web API** (`/api/web/*`) - For Next.js frontend
   - `/api/web/users` - User management
   - `/api/web/health` - Health check

2. **RPI API** (`/api/rpi/*`) - For Raspberry Pi 5
   - `/api/rpi/scan` - Handle bottle scans
   - `/api/rpi/authenticate` - QR code authentication
   - `/api/rpi/status` - System status
   - `/api/rpi/log` - Event logging

## Testing with REST Client

### Option 1: VS Code REST Client Extension

1. Install "REST Client" extension in VS Code
2. Open `api-tests.http`
3. Click "Send Request" above any endpoint

### Option 2: cURL Commands

```bash
# Test root endpoint
curl http://127.0.0.1:5000/

# Get all users
curl http://127.0.0.1:5000/api/web/users

# Create user
curl -X POST http://127.0.0.1:5000/api/web/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe"}'

# Scan bottle (RPI)
curl -X POST http://127.0.0.1:5000/api/rpi/scan \
  -H "Content-Type: application/json" \
  -d '{"bottle_type":"plastic","qr_code":"USER_QR_12345"}'
```

### Option 3: Postman

Import the endpoints from `API_DOCUMENTATION.md` into Postman.

## Frontend Integration

### Next.js Configuration

The frontend is already configured to proxy API requests:

**Client structure:**
```
client/src/services/
├── userService.js    # Web API calls
└── rpiService.js     # RPI API calls (for admin dashboard)
```

**Usage example:**
```javascript
import { userService } from '../src/services/userService';

// Get all users
const users = await userService.getAll();

// Create user
const newUser = await userService.create({ name: 'John Doe' });
```

## Raspberry Pi 5 Integration

### Example Python Code for RPI

```python
import requests
import json

API_BASE = "http://YOUR_SERVER_IP:5000/api/rpi"

# Authenticate user
def authenticate(qr_code):
    response = requests.post(
        f"{API_BASE}/authenticate",
        json={"qr_code": qr_code}
    )
    return response.json()

# Scan bottle
def scan_bottle(bottle_type, qr_code):
    response = requests.post(
        f"{API_BASE}/scan",
        json={
            "bottle_type": bottle_type,
            "qr_code": qr_code
        }
    )
    return response.json()

# Log event
def log_event(event_type, message):
    requests.post(
        f"{API_BASE}/log",
        json={
            "event_type": event_type,
            "message": message
        }
    )
```

## CORS Configuration

CORS is configured to allow requests from:
- `http://localhost:3000` (Next.js dev server)
- `http://127.0.0.1:3000`

To add Raspberry Pi IP, update `app/__init__.py`:

```python
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://YOUR_RPI_IP:*"  # Add this
        ],
        "methods": ["GET", "POST", "PUT", "DELETE"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})
```

## Next Steps

1. **Database Models**: Extend models for:
   - Transactions
   - Points/Rewards
   - QR codes
   - Bottle types

2. **Authentication**: Implement JWT or session-based auth

3. **RPI Integration**: 
   - Test from actual Raspberry Pi device
   - Add camera integration endpoints
   - Implement real-time status updates

4. **Web Dashboard**:
   - Admin panel to monitor RVM
   - User profile pages
   - Transaction history
   - Rewards redemption

5. **Production**:
   - Add proper logging
   - Implement rate limiting
   - Set up production database
   - Deploy backend (Heroku, AWS, etc.)

## Troubleshooting

### Port already in use
```bash
# Find and kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Database connection errors
- Verify MySQL is running
- Check DATABASE_URL in .env
- Ensure database exists

### CORS errors
- Check frontend is running on port 3000
- Verify CORS configuration includes your origin
- Check browser console for specific CORS error

## Support

For issues or questions:
1. Check `API_DOCUMENTATION.md` for endpoint details
2. Use `api-tests.http` for testing
3. Review Flask logs for error details
