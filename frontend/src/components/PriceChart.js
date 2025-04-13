import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const PriceChart = () => {
  const [priceData, setPriceData] = useState([]);
  const [timeframe, setTimeframe] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHistoricalData();
  }, [timeframe, fetchHistoricalData]);

  const fetchHistoricalData = async () => {
    try {
      setLoading(true);
      console.log('Fetching historical data...');
      const response = await fetch(`http://localhost:5000/api/bitcoin/historical?timeframe=${timeframe}`, {
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
        throw new Error(`Failed to fetch data: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Received data:', data);
      setPriceData(data);
      setError(null);
    } catch (err) {
      console.error('Detailed error:', err);
      setError(`Error fetching historical data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: priceData.map(item => item.date),
    datasets: [
      {
        label: 'Bitcoin Price (USD)',
        data: priceData.map(item => item.price),
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Bitcoin Price History'
      }
    },
    scales: {
      y: {
        beginAtZero: false
      }
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="price-chart">
      <div className="timeframe-selector">
        <button 
          onClick={() => setTimeframe('7d')} 
          className={timeframe === '7d' ? 'active' : ''}
        >
          7 Days
        </button>
        <button 
          onClick={() => setTimeframe('30d')} 
          className={timeframe === '30d' ? 'active' : ''}
        >
          30 Days
        </button>
        <button 
          onClick={() => setTimeframe('90d')} 
          className={timeframe === '90d' ? 'active' : ''}
        >
          90 Days
        </button>
      </div>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default PriceChart; 