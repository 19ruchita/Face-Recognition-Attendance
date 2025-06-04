import React, { useState, useEffect } from 'react';
import StartRecognitionButton from './components/StartRecognitionButton';
import './App.css';

function App() {
  const [backendStatus, setBackendStatus] = useState('');

  useEffect(() => {
    // Check if backend is running
    fetch('http://127.0.0.1:5000/')
      .then(response => response.json())
      .then(data => setBackendStatus(data.message))
      .catch(error => setBackendStatus('Backend not connected'));
  }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Face Recognition Attendance System</h1>x
        <p className="backend-status">{backendStatus}</p>
      </header>
      <main className="app-main">
        <StartRecognitionButton />
      </main>
    </div>
  );
}

export default App;