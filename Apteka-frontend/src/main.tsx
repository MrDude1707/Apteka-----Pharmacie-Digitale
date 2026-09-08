import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import ToastViewport from './components/ui/ToastViewport';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <>
      <App />
      <ToastViewport />
    </>
  </StrictMode>,
);
