// main.jsx or index.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContex.jsx'; // ✅ Adjust path if needed

const root = createRoot(document.getElementById('root'));

root.render(
  <StrictMode>
    <AuthProvider> {/* ✅ Wrap your entire app here */}
      <App />
    </AuthProvider>
  </StrictMode>
);

// Optional HMR reload
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    window.location.reload();
  });
}
