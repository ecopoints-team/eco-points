const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';

export const userService = {
  getAll: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/web/users`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      return data.success ? data.users : [];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  getById: async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/web/users/${userId}`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      return data.success ? data.user : null;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  },

  create: async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/web/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      return data.success ? data.user : null;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  healthCheck: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/web/health`);
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error checking API health:', error);
      return false;
    }
  }
};
