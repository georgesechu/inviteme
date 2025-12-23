import { app } from './app';

const PORT = process.env.PORT || 3000;

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth: http://localhost:${PORT}/api/auth`);
  console.log(`👥 Guests: http://localhost:${PORT}/api/guests`);
  console.log(`🎨 Card Designs: http://localhost:${PORT}/api/card-designs`);
  console.log(`💌 Invitations: http://localhost:${PORT}/api/invitations`);
  console.log(`💳 Payments: http://localhost:${PORT}/api/payments`);
});

