import React, { useState, useEffect, useRef } from 'react';
import './StartRecognitionButton.css';

const StartRecognitionButton = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('');
  const [recognitionResult, setRecognitionResult] = useState(null);
  const [matchedImage, setMatchedImage] = useState(null);
  const [isRecognitionActive, setIsRecognitionActive] = useState(false);
  const videoRef = useRef(null);
  const recognitionInterval = useRef(null);

  useEffect(() => {
    checkBackendConnection();
    startVideo();
  }, []);

  const startVideo = async () => {
    try {
      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setConnectionStatus('Error accessing camera. Please check permissions.');
    }
  };

  const checkBackendConnection = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setConnectionStatus('Backend connected');
        return true;
      } else {
        throw new Error('Backend connection failed');
      }
    } catch (error) {
      setConnectionStatus('Backend not connected - Please start the Python server');
      console.error('Connection error:', error);
      return false;
    }
  };

  const handleStartRecognition = async () => {
    setIsProcessing(true);
    try {
      // Capture image from video
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg');

      // Send image to backend
      const response = await fetch('http://127.0.0.1:5000/face_recognition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageData })
      });
      
      const data = await response.json();
      setRecognitionResult(data);
      
      if (data.imagePath) {
        const imageResponse = await fetch(`http://127.0.0.1:5000/get_image?path=${encodeURIComponent(data.imagePath)}`);
        const imageBlob = await imageResponse.blob();
        setMatchedImage(URL.createObjectURL(imageBlob));
      }
      
      setConnectionStatus(data.message);
    } catch (error) {
      setConnectionStatus('Error connecting to face recognition service');
      console.error('Error:', error);
    } finally {
      setIsProcessing(false);
    }
};

  const startContinuousRecognition = async () => {
    setIsRecognitionActive(true);
    recognitionInterval.current = setInterval(async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/face_recognition', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        setRecognitionResult(data);
        setConnectionStatus(data.message);
        
        if (data.imagePath) {
          const imageResponse = await fetch(`http://127.0.0.1:5000/get_image?path=${encodeURIComponent(data.imagePath)}`);
          const imageBlob = await imageResponse.blob();
          setMatchedImage(URL.createObjectURL(imageBlob));
        }
      } catch (error) {
        setConnectionStatus('Error connecting to face recognition service');
        console.error('Error:', error);
      }
    }, 2000); // Check every 2 seconds
  };

  const stopContinuousRecognition = () => {
    setIsRecognitionActive(false);
    if (recognitionInterval.current) {
      clearInterval(recognitionInterval.current);
    }
  };

  // Clean up interval on component unmount
  useEffect(() => {
    return () => {
      if (recognitionInterval.current) {
        clearInterval(recognitionInterval.current);
      }
    };
  }, []);

  return (
    <div className="recognition-container">
      <div className="video-recognition-wrapper">
        <div className="video-container">
          <video 
            ref={videoRef}
            autoPlay
            playsInline
            muted
            width="640"
            height="480"
            style={{ transform: 'scaleX(-1)' }}
            className="camera-feed"
          />
          {isProcessing && (
            <div className="loading-overlay">
              <div className="loading-text">Loading</div>
              <div className="face-frame"></div>
            </div>
          )}
        </div>
        <div className="recognition-info">
          <div className="status-message">{connectionStatus}</div>
          {recognitionResult && (
            <div className="recognition-result">
              <h3>Recognition Result:</h3>
              {matchedImage && (
                <div className="matched-person">
                  <img 
                    src={matchedImage} 
                    alt="Matched Person" 
                    className="matched-image"
                  />
                  <p className="matched-name">{recognitionResult.name}</p>
                </div>
              )}
              <p>{recognitionResult.message}</p>
              {recognitionResult.alreadyMarked && (
                <p className="already-marked">Attendance already marked today</p>
              )}
            </div>
          )}
        </div>
      </div>
      <button 
  className="recognition-button"
  onClick={handleStartRecognition}
  disabled={isProcessing}
>
  Start Face Recognition
</button>
    </div>
  );
};

export default StartRecognitionButton;