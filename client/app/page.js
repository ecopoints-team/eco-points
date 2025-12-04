'use client';

import React, { useState, useEffect } from 'react';

export default function Home() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setUsers(data.users))
      .catch(err => console.error('Error fetching users:', err));
  }, []);

  return (
    <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'Arial, sans-serif' }}>
      <h1>EcoPoints</h1>
      <h2>Users</h2>
      {users.length > 0 ? (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {users.map(user => (
            <li key={user.id} style={{ margin: '10px 0' }}>
              {user.name}
            </li>
          ))}
        </ul>
      ) : (
        <p>No users found or backend not connected.</p>
      )}
    </div>
  );
}
