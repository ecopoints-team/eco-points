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

### 1. Database Setup (PostgreSQL & pgAdmin)

1.  **Install PostgreSQL**: Download and install [PostgreSQL](https://www.postgresql.org/download/) for Windows.
2.  **Open pgAdmin 4**: This is the management tool installed with PostgreSQL.
3.  **Create Database**:
    - Right-click on **Databases** > **Create** > **Database...**
    - Name it `ecopoints`.
    - Click **Save**.
4.  **Note your credentials**: You will need your PostgreSQL username (default is `postgres`) and the password you set during installation.

### 2. Virtual Environment Setup

Using a virtual environment (`venv`) keeps your project dependencies organized and prevents conflicts.

```bash
# Navigate to the server directory
cd server

# Create the virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

*(You should now see `(venv)` at the start of your terminal prompt)*

### 3. Install Dependencies

Ensure your virtual environment is active, then run:

```bash
pip install -r requirements.txt
```

### 4. Configure Environment

Create a `.env` file in the `server/` directory:

```env
# Format: postgresql://<username>:<password>@localhost:5432/ecopoints
DATABASE_URL=postgresql://postgres:your_password_here@localhost:5432/ecopoints
SECRET_KEY=dev-secret-key-123
FLASK_APP=run.py
FLASK_DEBUG=1
```

### 5. Initialize & Upgrade Database

This will create the necessary tables in your PostgreSQL database.

```bash
# If this is your first time:
flask db init
flask db migrate -m "Initial migration"

# To apply the tables to PostgreSQL:
flask db upgrade
```

### 6. Run the Server

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
- **PostgreSQL Service**: Ensure PostgreSQL is running (check "Services" app on Windows).
- **Credentials**: Double-check `DATABASE_URL` in `.env`.
- **Database Name**: Ensure the database `ecopoints` exists in pgAdmin.
- **Port**: Default is `5432`. Ensure no other app is blocking it.
- **Password**: If you forgot your postgres password, you can reset it via `pg_hba.conf` (Advanced).

### CORS errors
- Check frontend is running on port 3000
- Verify CORS configuration includes your origin
- Check browser console for specific CORS error

## Support

For issues or questions:
1. Check `API_DOCUMENTATION.md` for endpoint details
2. Use `api-tests.http` for testing
3. Review Flask logs for error details
