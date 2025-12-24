import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { Button } from '../components/ui/button';
import { MessageCircle, Users, Image, CreditCard, CheckCircle2 } from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Logo size="lg" />
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
            <Link to="/login">
              <Button size="sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <section className="mx-auto max-w-7xl px-4 py-20 text-center">
          <h1 className="mb-6 text-5xl font-bold text-slate-900">
            Beautiful Event Invitations
            <br />
            <span className="text-green-600">Delivered via WhatsApp</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-slate-600">
            Create personalized invitation cards for any event, manage your guest list, and send them directly to your guests via WhatsApp. Simple, elegant, and efficient.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/login">
              <Button size="lg">
                Get Started Free
              </Button>
            </Link>
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="mx-auto max-w-7xl px-4 py-20">
          <h2 className="mb-12 text-center text-3xl font-bold text-slate-900">
            Everything you need for your event invitations
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <Image className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-slate-900">Custom Card Designs</h3>
              <p className="text-slate-600">
                Upload your own card design and customize it with guest names and QR codes for easy verification.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-slate-900">Guest Management</h3>
              <p className="text-slate-600">
                Organize your guest list, track RSVPs, and manage invitations all in one place.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <MessageCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-slate-900">WhatsApp Delivery</h3>
              <p className="text-slate-600">
                Send personalized invitations directly to your guests via WhatsApp with delivery and read receipts.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-slate-900">Status Tracking</h3>
              <p className="text-slate-600">
                See when invitations are sent, delivered, and read by your guests in real-time.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <CreditCard className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-slate-900">Affordable Pricing</h3>
              <p className="text-slate-600">
                Purchase message bundles at competitive rates. Pay only for what you use.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <MessageCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-slate-900">Easy Setup</h3>
              <p className="text-slate-600">
                Get started in minutes. No technical knowledge required. Just sign in with WhatsApp and begin.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="mx-auto max-w-7xl px-4 py-20">
          <div className="rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-slate-900">Ready to get started?</h2>
            <p className="mb-8 text-lg text-slate-600">
              Join WAgeni today and make your event invitation process effortless.
            </p>
            <Link to="/login">
              <Button size="lg">
                Create Your First Event
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <Logo size="md" />
            <p className="text-sm text-slate-600">
              © {new Date().getFullYear()} WAgeni. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

