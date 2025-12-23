import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@inviteme/shared';
import { useSDK } from '../sdk';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Alert } from '../components/ui/alert';
import { Spinner } from '../components/ui/spinner';

export function LoginPage() {
  const navigate = useNavigate();
  const sdk = useSDK();
  const auth = useAuth(sdk.auth);
  const [phoneNumber, setPhoneNumber] = useState('+2557');
  const [code, setCode] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (auth.isAuthenticated) {
      navigate('/guests', { replace: true });
    }
  }, [auth.isAuthenticated, navigate]);

  const handleRequestCode = async () => {
    await auth.requestCode(phoneNumber);
  };

  const handleVerifyCode = async () => {
    const success = await auth.verifyCode(phoneNumber, code);
    if (success) {
      navigate('/events');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Welcome to InviteMe</CardTitle>
          <CardDescription>Sign in with your WhatsApp number</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="flex gap-2">
              <Input
                id="phone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+255712345678"
                className="flex-1"
              />
              <Button
                onClick={handleRequestCode}
                disabled={auth.requestCodeState.isLoading || !phoneNumber}
              >
                {auth.requestCodeState.isLoading ? <Spinner /> : 'Send Code'}
              </Button>
            </div>
            {auth.requestCodeState.success && (
              <Alert variant="info" className="text-sm">
                Code sent! Check your WhatsApp messages.
              </Alert>
            )}
            {auth.requestCodeState.error && (
              <Alert variant="error" className="text-sm">
                {auth.requestCodeState.error}
              </Alert>
            )}
          </div>

          {auth.requestCodeState.success && (
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <div className="flex gap-2">
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="6-digit code"
                  className="flex-1"
                  maxLength={6}
                />
                <Button
                  onClick={handleVerifyCode}
                  disabled={auth.verifyCodeState.isLoading || code.length !== 6}
                >
                  {auth.verifyCodeState.isLoading ? <Spinner /> : 'Verify'}
                </Button>
              </div>
              {auth.verifyCodeState.error && (
                <Alert variant="error" className="text-sm">
                  {auth.verifyCodeState.error}
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

