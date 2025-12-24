import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#ffffff',
          },
          headerTintColor: '#000000',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'WAgeni',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="login"
          options={{
            title: 'Sign In',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="events"
          options={{
            title: 'My Events',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="events/[eventId]"
          options={{
            title: 'Guests',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="events/[eventId]/design"
          options={{
            title: 'Design Card',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="account"
          options={{
            title: 'Account',
            headerShown: true,
          }}
        />
      </Stack>
    </>
  );
}
