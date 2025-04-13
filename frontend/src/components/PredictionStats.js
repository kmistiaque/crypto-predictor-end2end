import React, { useState, useEffect } from 'react';
import '../styles/PredictionStats.css';

const PredictionStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/stats');
        if (!response.ok) {
          throw new Error('Failed to fetch prediction stats');
        }
        const data = await response.json();
        setStats(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div>Loading stats...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!stats) return <div>No stats available</div>;

  return (
    <div className="prediction-stats">
      <h2>Prediction Statistics</h2>
      {loading ? (
        <p>Loading statistics...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Model Performance</h3>
            <p>
              <span>Mean Absolute Error:</span>
              <span>{stats.mae.toFixed(4)}</span>
            </p>
            <p>
              <span>Root Mean Square Error:</span>
              <span>{stats.rmse.toFixed(4)}</span>
            </p>
            <p>
              <span>R-squared Score:</span>
              <span>{stats.r2_score.toFixed(4)}</span>
            </p>
          </div>
          
          <div className="stat-card">
            <h3>Latest Prediction</h3>
            <p>
              <span>Current Price:</span>
              <span>${stats.current_price.toFixed(2)}</span>
            </p>
            <p>
              <span>Predicted Price:</span>
              <span>${stats.predicted_price.toFixed(2)}</span>
            </p>
            <p>
              <span>Prediction Time:</span>
              <span>{new Date(stats.prediction_time).toLocaleString()}</span>
            </p>
          </div>
          
          <div className="stat-card">
            <h3>Market Indicators</h3>
            <p>
              <span>24h Volume:</span>
              <span>${stats.volume_24h.toLocaleString()}</span>
            </p>
            <p>
              <span>Market Cap:</span>
              <span>${stats.market_cap.toLocaleString()}</span>
            </p>
            <p>
              <span>Price Change (24h):</span>
              <span className={stats.price_change_24h >= 0 ? 'positive' : 'negative'}>
                {stats.price_change_24h.toFixed(2)}%
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictionStats; 