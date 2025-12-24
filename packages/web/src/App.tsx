import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { EventsPage } from './pages/EventsPage';
import { EventGuestsPage } from './pages/EventGuestsPage';
import { TemplateBuilderPage } from './pages/TemplateBuilderPage';
import { AccountPage } from './pages/AccountPage';
import { Layout } from './components/Layout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Layout />}>
          <Route index element={<LoginPage />} />
        </Route>
        <Route path="/events" element={<Layout requireAuth />}>
          <Route index element={<EventsPage />} />
          <Route path=":eventId" element={<EventGuestsPage />} />
          <Route path=":eventId/design" element={<TemplateBuilderPage />} />
        </Route>
        <Route path="/account" element={<Layout requireAuth />}>
          <Route index element={<AccountPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

