import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log('App initialization started');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("Root element not found");
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
console.log('App mount call completed');

// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     // Usar caminho relativo garante que o worker seja encontrado na mesma origem.
//     navigator.serviceWorker.register('./service-worker.js').then(registration => {
//       console.log('ServiceWorker registrado com sucesso:', registration.scope);
//     }).catch(err => {
//       console.warn('Falha ao registrar ServiceWorker:', err);
//     });
//   });
// }