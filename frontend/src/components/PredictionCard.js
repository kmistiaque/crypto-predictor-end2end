import React, { useState, useEffect } from 'react';

const PredictionCard = () => {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPrediction();
    // Refresh prediction every 5 minutes
    const interval = setInterval(fetchPrediction, 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchPrediction = async () => {
    try {
      setLoading(true);
      console.log('Fetching prediction...');
      const response = await fetch('http://localhost:5000/api/bitcoin/predict', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        mode: 'cors'
      });
      
      console.log('Response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to fetch prediction: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Received prediction data:', data);
      setPrediction(data);
      setError(null);
    } catch (err) {
      console.error('Detailed error:', err);
      setError(`Error fetching prediction: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading prediction...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!prediction) return null;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  return (
    <div className="prediction-card">
      <h2>Bitcoin Price Prediction</h2>
      <div className="price-info">
        <div className="current-price">
          <h3>Current Price</h3>
          <p>{formatPrice(prediction.current_price)}</p>
        </div>
        <div className="predicted-price">
          <h3>Predicted Price</h3>
          <p>{formatPrice(prediction.prediction)}</p>
        </div>
      </div>
      <div className="prediction-details">
        <div className={`trend ${prediction.trend}`}>
          <h3>Trend</h3>
          <p>{prediction.trend.toUpperCase()}</p>
        </div>
        <div className="change">
          <h3>Predicted Change</h3>
          <p className={prediction.change_percent >= 0 ? 'positive' : 'negative'}>
            {prediction.change_percent.toFixed(2)}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default PredictionCard; 