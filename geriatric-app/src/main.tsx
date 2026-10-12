import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/fraunces';
import '@fontsource-variable/plus-jakarta-sans';
import './styles.css';
import App from './App';
import { AccesibilidadProvider } from './context/AccesibilidadContext';
import { ToastProvider } from './context/ToastContext';
import { AppProvider } from './context/AppContext';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AccesibilidadProvider>
      <ToastProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </ToastProvider>
    </AccesibilidadProvider>
  </React.StrictMode>
);
