import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@inviteme/shared';
import { useSDK } from '../sdk';
import { Logo } from '../components/Logo';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Alert } from '../components/ui/alert';
import { Spinner } from '../components/ui/spinner';
import { MessageCircle, Shield, Zap, CheckCircle2 } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const sdk = useSDK();
  const auth = useAuth(sdk.auth);
  const [phoneNumber, setPhoneNumber] = useState('+2557');
  const [code, setCode] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (auth.isAuthenticated) {
      navigate('/events', { replace: true });
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link to="/">
            <Logo size="md" />
          </Link>
          <Link to="/">
            <Button variant="outline" size="sm">
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Side - Login Form */}
          <div className="flex items-center">
            <Card className="w-full shadow-lg">
              <CardHeader className="space-y-3 text-center">
                <div className="flex flex-col items-center gap-3">
                  <Logo size="lg" />
                  <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
                </div>
                <CardDescription className="text-base">
                  Sign in with your WhatsApp number to access your events
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Phone Number
                  </Label>
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
                      className="min-w-[120px]"
                    >
                      {auth.requestCodeState.isLoading ? (
                        <>
                          <Spinner />
                          Sending...
                        </>
                      ) : (
                        <>
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Send Code
                        </>
                      )}
                    </Button>
                  </div>
                  {auth.requestCodeState.success && (
                    <Alert variant="info" className="text-sm">
                      <MessageCircle className="h-4 w-4" />
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
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                    <Label htmlFor="code" className="text-sm font-medium">
                      Verification Code
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="code"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter 6-digit code"
                        className="flex-1 text-center text-lg tracking-widest font-mono"
                        maxLength={6}
                        autoFocus
                      />
                      <Button
                        onClick={handleVerifyCode}
                        disabled={auth.verifyCodeState.isLoading || code.length !== 6}
                        className="min-w-[120px]"
                      >
                        {auth.verifyCodeState.isLoading ? (
                          <>
                            <Spinner />
                            Verifying...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Verify
                          </>
                        )}
                      </Button>
                    </div>
                    {auth.verifyCodeState.error && (
                      <Alert variant="error" className="text-sm">
                        {auth.verifyCodeState.error}
                      </Alert>
                    )}
                  </div>
                )}

                <div className="pt-4 border-t border-slate-200">
                  <p className="text-xs text-center text-slate-500">
                    Don't have an account? Your account will be created automatically when you sign in.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Features/Benefits */}
          <div className="flex items-center">
            <div className="space-y-8">
              <div>
                <h2 className="mb-4 text-3xl font-bold text-slate-900">
                  Why choose WAgeni?
                </h2>
                <p className="text-lg text-slate-600">
                  The easiest way to manage and send event invitations via WhatsApp.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-green-100">
                    <MessageCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="mb-1 text-lg font-semibold text-slate-900">
                      WhatsApp Integration
                    </h3>
                    <p className="text-slate-600">
                      Send invitations directly through WhatsApp. Your guests receive them instantly, and you can track delivery and read status.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-green-100">
                    <Zap className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="mb-1 text-lg font-semibold text-slate-900">
                      Quick Setup
                    </h3>
                    <p className="text-slate-600">
                      Get started in minutes. No complicated setup required. Just sign in and create your first event.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-green-100">
                    <Shield className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="mb-1 text-lg font-semibold text-slate-900">
                      Secure & Private
                    </h3>
                    <p className="text-slate-600">
                      Your data is secure. We use WhatsApp's secure authentication and never share your information.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-green-200 bg-green-50 p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-900 mb-1">Free to Get Started</p>
                    <p className="text-sm text-green-700">
                      Create unlimited events and manage your guest list. Only pay for WhatsApp messages you send.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

