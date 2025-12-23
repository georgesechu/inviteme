import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { SDKProvider } from './sdk';

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SDKProvider baseUrl={apiBase}>
      <App />
    </SDKProvider>
  </React.StrictMode>
);

