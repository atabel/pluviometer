import React from 'react';
import ReactDOM from 'react-dom';
import App from './app';
import registerServiceWorker from './register-service-worker';

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
registerServiceWorker();
