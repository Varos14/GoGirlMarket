import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import store from './store';
import './index.css';
import App from './App.jsx';

// Set the base URL for API requests. 
// Locally, this will be empty (and use Vite proxy). In production on Vercel, it uses the Render URL.
axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>,
)
