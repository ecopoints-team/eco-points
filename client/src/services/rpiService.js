const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';

export const rpiService = {
  getStatus: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rpi/status`);
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      console.error('Error fetching RPI status:', error);
      throw error;
    }
  },

  authenticate: async (qrCode) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rpi/authenticate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qr_code: qrCode }),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      console.error('Error authenticating user:', error);
      throw error;
    }
  },

  scanBottle: async (bottleType, qrCode, timestamp) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rpi/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bottle_type: bottleType,
          qr_code: qrCode,
          timestamp: timestamp || new Date().toISOString(),
        }),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      console.error('Error scanning bottle:', error);
      throw error;
    }
  },

  logEvent: async (eventType, message) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rpi/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_type: eventType,
          message: message,
        }),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      console.error('Error logging event:', error);
      throw error;
    }
  },

  healthCheck: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rpi/health`);
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error checking RPI API health:', error);
      return false;
    }
  }
};
