'use client';

import { useEffect } from 'react';

export default function PWARegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('Service Worker registrato con successo:', reg.scope);
          })
          .catch((err) => {
            console.error('Errore durante la registrazione del Service Worker:', err);
          });
      });
    }
  }, []);

  return null;
}
