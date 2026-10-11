import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@fontsource-variable/fraunces';
import '@fontsource-variable/plus-jakarta-sans';
import './index.css';
import './tema.css';
import './accesibilidad.css';
import { AccesibilidadProvider } from './context/AccesibilidadContext';
import { NotificationProvider } from './context/NotificationContext';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AccesibilidadProvider>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </AccesibilidadProvider>
  </React.StrictMode>
);
