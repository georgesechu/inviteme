# API Client Usage

The shared package includes a typed fetch-based API client that can be used in both web and mobile apps.

## Basic Setup

```typescript
import { createApiClient } from '@inviteme/shared';

// Create client instance
const api = createApiClient({
  baseUrl: 'http://localhost:3000',
  getToken: () => {
    // Return auth token from your storage (localStorage, AsyncStorage, etc.)
    return localStorage.getItem('authToken');
  },
});
```

## Authentication

### Request Login Code

```typescript
const response = await api.requestCode({
  phoneNumber: '+255712345678',
});

if (response.success) {
  console.log('Code sent!');
} else {
  console.error(response.error);
}
```

### Verify Code

```typescript
const response = await api.verifyCode({
  phoneNumber: '+255712345678',
  code: '123456',
});

if (response.success && response.data) {
  const { user, token } = response.data;
  // Store token for future requests
  localStorage.setItem('authToken', token);
} else {
  console.error(response.error);
}
```

## Guest Management

### Get All Guests

```typescript
const response = await api.getGuests();

if (response.success && response.data) {
  const guests = response.data;
  console.log('Guests:', guests);
}
```

### Create Guest

```typescript
const response = await api.createGuest({
  name: 'John Doe',
  mobile: '+255712345678',
  type: 'Single',
});

if (response.success && response.data) {
  console.log('Guest created:', response.data);
}
```

### Update Guest

```typescript
const response = await api.updateGuest('guest-id', {
  name: 'Jane Doe',
  type: 'Double',
});

if (response.success && response.data) {
  console.log('Guest updated:', response.data);
}
```

### Delete Guest

```typescript
const response = await api.deleteGuest('guest-id');

if (response.success) {
  console.log('Guest deleted');
}
```

## React Example

```typescript
import { useState, useEffect } from 'react';
import { createApiClient, type Guest } from '@inviteme/shared';

const api = createApiClient({
  baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3000',
  getToken: () => localStorage.getItem('authToken'),
});

function GuestsList() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGuests() {
      const response = await api.getGuests();
      if (response.success && response.data) {
        setGuests(response.data);
      }
      setLoading(false);
    }
    fetchGuests();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <ul>
      {guests.map(guest => (
        <li key={guest.id}>{guest.name} - {guest.type}</li>
      ))}
    </ul>
  );
}
```

## React Native Example

```typescript
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createApiClient, type Guest } from '@inviteme/shared';

const api = createApiClient({
  baseUrl: 'http://localhost:3000',
  getToken: async () => await AsyncStorage.getItem('authToken'),
});

function GuestsList() {
  const [guests, setGuests] = useState<Guest[]>([]);

  useEffect(() => {
    async function fetchGuests() {
      const response = await api.getGuests();
      if (response.success && response.data) {
        setGuests(response.data);
      }
    }
    fetchGuests();
  }, []);

  // ... rest of component
}
```

