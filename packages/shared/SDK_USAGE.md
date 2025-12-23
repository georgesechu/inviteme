# SDK Usage Guide

The SDK layer provides state management and business logic, separating UI concerns from API calls.

## Architecture

```
UI Components
    ↓
SDK (State Management + Business Logic)
    ↓
API Client (HTTP Requests)
    ↓
Server
```

## Basic Setup

### Web (React)

```typescript
import { createSDK } from '@inviteme/shared';
import { useAuth, useGuests } from '@inviteme/shared';

// Create SDK instance (typically in a context or singleton)
const sdk = createSDK({
  baseUrl: 'http://localhost:3000',
});

// Use in components
function App() {
  const auth = useAuth(sdk.auth);
  const guests = useGuests(sdk.guests);

  if (!auth.isAuthenticated) {
    return <LoginScreen />;
  }

  return <GuestsList />;
}
```

### React Native

```typescript
import { createSDK } from '@inviteme/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth, useGuests } from '@inviteme/shared';

// Create custom storage adapter for React Native
class ReactNativeStorageAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    return await AsyncStorage.getItem(key);
  }
  
  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  }
  
  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }
}

const sdk = createSDK({
  baseUrl: 'http://localhost:3000',
  storage: new ReactNativeStorageAdapter(),
});
```

## Authentication

### Using Hooks (React/React Native)

```typescript
import { useAuth } from '@inviteme/shared';

function LoginScreen() {
  const auth = useAuth(sdk.auth);

  const handleRequestCode = async () => {
    await auth.requestCode('+255712345678');
  };

  const handleVerifyCode = async (code: string) => {
    const success = await auth.verifyCode('+255712345678', code);
    if (success) {
      // Navigate to main app
    }
  };

  return (
    <div>
      {auth.requestCodeState.isLoading && <p>Sending code...</p>}
      {auth.requestCodeState.success && <p>Code sent!</p>}
      {auth.requestCodeState.error && <p>Error: {auth.requestCodeState.error}</p>}
      
      <button onClick={handleRequestCode}>Request Code</button>
      
      {auth.requestCodeState.success && (
        <input
          type="text"
          placeholder="Enter code"
          onBlur={(e) => handleVerifyCode(e.target.value)}
        />
      )}
      
      {auth.verifyCodeState.isLoading && <p>Verifying...</p>}
      {auth.verifyCodeState.error && <p>Error: {auth.verifyCodeState.error}</p>}
    </div>
  );
}
```

### Using SDK Directly (Non-React)

```typescript
// Subscribe to state changes
const unsubscribe = sdk.auth.subscribe((state) => {
  console.log('Auth state:', state);
  if (state.isAuthenticated) {
    console.log('User:', state.user);
  }
});

// Request code
await sdk.auth.requestCode('+255712345678');

// Verify code
const success = await sdk.auth.verifyCode('+255712345678', '123456');

// Logout
sdk.auth.logout();

// Cleanup
unsubscribe();
```

## Guest Management

### Using Hooks

```typescript
import { useGuests } from '@inviteme/shared';

function GuestsList() {
  const guests = useGuests(sdk.guests);

  const handleCreate = async () => {
    const newGuest = await guests.createGuest(
      'John Doe',
      '+255712345678',
      'Single'
    );
    
    if (newGuest) {
      console.log('Guest created:', newGuest);
    } else {
      console.error('Error:', guests.error);
    }
  };

  const handleDelete = async (id: string) => {
    const success = await guests.deleteGuest(id);
    if (success) {
      console.log('Guest deleted');
    }
  };

  return (
    <div>
      {guests.isLoading && <p>Loading guests...</p>}
      {guests.error && <p>Error: {guests.error}</p>}
      
      <button onClick={handleCreate} disabled={guests.isCreating}>
        {guests.isCreating ? 'Creating...' : 'Add Guest'}
      </button>
      
      <ul>
        {guests.guests.map(guest => (
          <li key={guest.id}>
            {guest.name} - {guest.type}
            <button
              onClick={() => handleDelete(guest.id)}
              disabled={guests.isDeleting}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Using SDK Directly

```typescript
// Subscribe to state changes
const unsubscribe = sdk.guests.subscribe((state) => {
  console.log('Guests:', state.guests);
  console.log('Loading:', state.isLoading);
  console.log('Error:', state.error);
});

// Load guests
await sdk.guests.loadGuests();

// Create guest
const newGuest = await sdk.guests.createGuest(
  'John Doe',
  '+255712345678',
  'Single'
);

// Update guest
const updated = await sdk.guests.updateGuest(guestId, {
  name: 'Jane Doe',
  type: 'Double',
});

// Delete guest
await sdk.guests.deleteGuest(guestId);

// Get guest by ID
const guest = sdk.guests.getGuestById(guestId);

// Cleanup
unsubscribe();
```

## State Management

The SDK manages all state internally and notifies subscribers of changes:

### Auth State

```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}
```

### Guests State

```typescript
interface GuestsState {
  guests: Guest[];
  isLoading: boolean;
  error: string | null;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}
```

## Benefits

1. **Separation of Concerns**: UI doesn't need to know about API endpoints
2. **State Management**: Automatic state updates and notifications
3. **Type Safety**: Full TypeScript support
4. **Reusability**: Same SDK works in web and mobile
5. **Error Handling**: Centralized error management
6. **Loading States**: Built-in loading indicators
7. **Persistence**: Automatic token/user storage

## React Context Example

```typescript
import { createContext, useContext } from 'react';
import { createSDK, type SDK } from '@inviteme/shared';

const SDKContext = createContext<SDK | null>(null);

export function SDKProvider({ children }: { children: React.ReactNode }) {
  const sdk = createSDK({
    baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3000',
  });

  return <SDKContext.Provider value={sdk}>{children}</SDKContext.Provider>;
}

export function useSDK() {
  const sdk = useContext(SDKContext);
  if (!sdk) {
    throw new Error('useSDK must be used within SDKProvider');
  }
  return sdk;
}

// Usage in components
function MyComponent() {
  const sdk = useSDK();
  const auth = useAuth(sdk.auth);
  const guests = useGuests(sdk.guests);
  // ...
}
```

