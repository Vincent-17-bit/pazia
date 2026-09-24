import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App.jsx';
import { queryClient } from './lib/queryClient.js';
import { MyListProvider } from './context/MyListContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { RatingsProvider } from './context/RatingsContext.jsx';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <MyListProvider>
            <RatingsProvider>
              <App />
            </RatingsProvider>
          </MyListProvider>
        </ToastProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
