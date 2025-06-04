import React, { useState } from 'react';

export default function StartRecognitionButton() {
  const [message, setMessage] = useState('');

  const handleStart = async () => {
    try {
      const response = await fetch('/start-recognition');
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message);
      } else {
        setMessage('Error: ' + data.error);
      }
    } catch (err) {
      setMessage('Fetch error: ' + err.message);
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: 50 }}>
      <button onClick={handleStart} style={{ padding: '10px 20px', fontSize: '16px' }}>
        Start Face Recognition
      </button>
      {message && <p>{message}</p>}
    </div>
  );
}
