import { useEffect, useState } from 'react';
import { useAccount } from '@inviteme/shared';
import { useSDK } from '../sdk';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Alert } from '../components/ui/alert';
import { Spinner } from '../components/ui/spinner';
import { MessageSquare, CreditCard } from 'lucide-react';

// Predefined message bundles
const MESSAGE_BUNDLES = [
  { messages: 50, price: 5.00, label: '50 messages' },
  { messages: 100, price: 9.00, label: '100 messages', popular: true },
  { messages: 250, price: 20.00, label: '250 messages' },
  { messages: 500, price: 35.00, label: '500 messages' },
  { messages: 1000, price: 60.00, label: '1000 messages' },
];

export function AccountPage() {
  const sdk = useSDK();
  const account = useAccount(sdk.account);
  const [selectedBundle, setSelectedBundle] = useState<typeof MESSAGE_BUNDLES[0] | null>(null);

  useEffect(() => {
    account.loadAccount();
  }, []);

  const handlePurchaseBundle = async (bundle: typeof MESSAGE_BUNDLES[0]) => {
    const result = await account.purchaseBundle({
      messages: bundle.messages,
      amount: bundle.price,
      currency: 'USD',
      paymentMethod: 'manual',
    });

    if (result) {
      alert(`Successfully purchased ${bundle.messages} messages! Your new balance is ${result.newBalance} messages.`);
      setSelectedBundle(null);
      await account.loadAccount();
    } else {
      alert('Purchase failed: ' + (account.error || 'Unknown error'));
    }
  };


  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Account</h1>
          <p className="mt-2 text-slate-600">Manage your account and purchase message bundles</p>
        </div>

        {/* Account Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            {account.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner />
              </div>
            ) : account.account ? (
              <div className="space-y-4">
                <div>
                  <Label className="text-slate-500">Phone Number</Label>
                  <p className="text-lg font-medium text-slate-900">{account.account.phoneNumber}</p>
                </div>
                <div>
                  <Label className="text-slate-500">Message Credits</Label>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-green-600" />
                    <p className="text-2xl font-bold text-slate-900">
                      {account.account.messageCredits}
                    </p>
                    <span className="text-slate-600">messages available</span>
                  </div>
                </div>
                <div>
                  <Label className="text-slate-500">Member Since</Label>
                  <p className="text-slate-900">
                    {new Date(account.account.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ) : (
              <Alert variant="error">
                {account.error || 'Failed to load account information'}
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Purchase Bundles Card */}
        <Card>
          <CardHeader>
            <CardTitle>Purchase Message Bundles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Predefined Bundles */}
              <div>
                <Label className="mb-4 block">Select a Bundle</Label>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {MESSAGE_BUNDLES.map((bundle) => (
                    <Card
                      key={bundle.messages}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedBundle?.messages === bundle.messages
                          ? 'border-green-500 bg-green-50'
                          : ''
                      } ${bundle.popular ? 'border-2 border-green-300' : ''}`}
                      onClick={() => setSelectedBundle(bundle)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-slate-900">{bundle.label}</span>
                          {bundle.popular && (
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                              Popular
                            </span>
                          )}
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-slate-900">${bundle.price}</span>
                          <span className="text-sm text-slate-500">USD</span>
                        </div>
                        <div className="mt-2 text-xs text-slate-600">
                          ${(bundle.price / bundle.messages).toFixed(3)} per message
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Purchase Button */}
              {selectedBundle && (
                <div className="flex items-center gap-4 rounded-lg border border-green-200 bg-green-50 p-4">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">
                      {selectedBundle.label} - ${selectedBundle.price}
                    </p>
                    <p className="text-sm text-slate-600">
                      ${(selectedBundle.price / selectedBundle.messages).toFixed(3)} per message
                    </p>
                  </div>
                  <Button
                    onClick={() => handlePurchaseBundle(selectedBundle)}
                    disabled={account.isPurchasing}
                  >
                    {account.isPurchasing ? (
                      <>
                        <Spinner />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Purchase
                      </>
                    )}
                  </Button>
                </div>
              )}


              {account.error && (
                <Alert variant="error">{account.error}</Alert>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

