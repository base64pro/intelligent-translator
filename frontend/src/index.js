import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.scss'; // Changed from .css to .scss
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);