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

const PredictionChart = () => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/predictions');
        if (!response.ok) {
          throw new Error('Failed to fetch prediction data');
        }
        const data = await response.json();
        
        // Process the data for the chart
        const labels = data.historical.map(item => new Date(item.timestamp).toLocaleDateString());
        const historicalPrices = data.historical.map(item => item.price);
        const predictedPrices = data.predictions.map(item => item.price);
        
        // Create prediction labels (future dates)
        const lastDate = new Date(data.historical[data.historical.length - 1].timestamp);
        const predictionLabels = data.predictions.map((_, index) => {
          const date = new Date(lastDate);
          date.setDate(date.getDate() + index + 1);
          return date.toLocaleDateString();
        });

        setChartData({
          labels: [...labels, ...predictionLabels],
          datasets: [
            {
              label: 'Historical Price',
              data: [...historicalPrices, ...Array(predictionLabels.length).fill(null)],
              borderColor: 'rgb(75, 192, 192)',
              tension: 0.1,
            },
            {
              label: 'Predicted Price',
              data: [...Array(labels.length).fill(null), ...predictedPrices],
              borderColor: 'rgb(255, 99, 132)',
              borderDash: [5, 5],
              tension: 0.1,
            }
          ]
        });
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Bitcoin Price Prediction'
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: 'Price (USD)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!chartData) return <div>No data available</div>;

  return (
    <div style={{ width: '100%', height: '600px', padding: '20px' }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default PredictionChart; 