import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar, RefreshCw } from 'lucide-react';
import * as tf from 'tensorflow';

export default function BitcoinPricePredictor() {
  const [historicalData, setHistoricalData] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('7d');
  const [trend, setTrend] = useState(null);
  const [model, setModel] = useState(null);
  const [modelLoading, setModelLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load model (in a real implementation, you would use proper backend integration)
  useEffect(() => {
    async function loadModel() {
      try {
        setModelLoading(true);
        
        // In a real implementation, your backend would host the model and expose API endpoints
        // This is a placeholder to demonstrate the concept
        console.log("Loading model from backend...");
        
        // Simulating model loading - in reality, you'd call your backend API
        setTimeout(() => {
          console.log("Model loaded successfully");
          setModel({ loaded: true });
          setModelLoading(false);
        }, 2000);
        
      } catch (err) {
        console.error("Failed to load model:", err);
        setError("Failed to load prediction model");
        setModelLoading(false);
      }
    }
    
    loadModel();
  }, []);

  // Fetch Bitcoin data based on timeframe
  useEffect(() => {
    async function fetchBitcoinData() {
      try {
        setLoading(true);
        setError(null);
        
        // Add this inside your fetchBitcoinData function
console.log("API URL:", process.env.REACT_APP_API_URL);
console.log("Full request URL:", `${process.env.REACT_APP_API_URL}/api/bitcoin/historical?timeframe=${timeframe}`);
        
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/bitcoin/historical?timeframe=${timeframe}`);
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Received historical data:", data);
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        setHistoricalData(data);
        
        // After getting historical data, fetch prediction
        await fetchPrediction(data);
        
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch Bitcoin data:", err);
        setError("Failed to fetch Bitcoin price data: " + err.message);
        setLoading(false);
      }
    }
    
    fetchBitcoinData();
  }, [timeframe, model]);

// Add a new function to handle prediction separately
async function fetchPrediction(data) {
  try {
    console.log("Fetching prediction data...");
    const predResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/bitcoin/predict`);
    
    if (!predResponse.ok) {
      throw new Error(`HTTP error ${predResponse.status}`);
    }
    
    const predData = await predResponse.json();
    console.log("Received prediction data:", predData);
    
    if (predData.error) {
      throw new Error(predData.error);
    }
    
    setPrediction(predData.prediction);
    setTrend(predData.trend);
    
  } catch (err) {
    console.error("Prediction error:", err);
    setError("Failed to get prediction: " + err.message);
  }
}
  // Function to refresh data
  const handleRefresh = () => {
    setLoading(true);
    setPrediction(null);
    
    // Re-fetch data - in a real implementation, this would call your backend API
    // For now, we'll simulate by triggering the useEffect
    setTimeout(() => {
      // This will retrigger the useEffect that fetches data
      setTimeframe(prev => {
        // Toggle and then immediately set back to retrigger effect
        const temp = prev === '7d' ? '30d' : '7d';
        setTimeout(() => setTimeframe(prev), 10);
        return temp;
      });
    }, 100);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Format dates for chart display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <div className="flex flex-col p-6 max-w-5xl mx-auto bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">Bitcoin Price Predictor</h1>
          <p className="text-sm text-gray-600">Using LSTM Neural Network Model</p>
        </div>
        
        <div className="flex space-x-4 items-center mt-4 md:mt-0">
          <button
            className="px-3 py-2 bg-blue-600 text-white rounded-md flex items-center hover:bg-blue-700 disabled:opacity-50"
            onClick={handleRefresh}
            disabled={loading || modelLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <div className="flex rounded-md shadow-sm">
            <button
              className={`px-3 py-2 border border-gray-300 rounded-l-md ${timeframe === '7d' ? 'bg-blue-100 border-blue-500' : 'bg-white'}`}
              onClick={() => !loading && setTimeframe('7d')}
              disabled={loading}
            >
              7D
            </button>
            <button
              className={`px-3 py-2 border border-gray-300 ${timeframe === '30d' ? 'bg-blue-100 border-blue-500' : 'bg-white'}`}
              onClick={() => !loading && setTimeframe('30d')}
              disabled={loading}
            >
              30D
            </button>
            <button
              className={`px-3 py-2 border border-gray-300 rounded-r-md ${timeframe === '90d' ? 'bg-blue-100 border-blue-500' : 'bg-white'}`}
              onClick={() => !loading && setTimeframe('90d')}
              disabled={loading}
            >
              90D
            </button>
          </div>
        </div>
      </div>

      {/* Model loading status */}
      {modelLoading && (
        <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded flex items-center">
          <div className="animate-pulse mr-2 h-3 w-3 rounded-full bg-blue-500"></div>
          Loading LSTM prediction model...
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Current Price Card */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center mb-2">
            <DollarSign className="mr-2 h-5 w-5 text-yellow-500" />
            <h2 className="text-lg font-semibold text-gray-700">Current Price</h2>
          </div>
          {loading ? (
            <div className="h-12 bg-gray-200 animate-pulse rounded"></div>
          ) : (
            <p className="text-3xl font-bold text-gray-900">
              {historicalData.length > 0 ? formatCurrency(historicalData[historicalData.length - 1].price) : 'N/A'}
            </p>
          )}
        </div>

        {/* Prediction Card */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center mb-2">
            {trend === 'up' ? (
              <TrendingUp className="mr-2 h-5 w-5 text-green-500" />
            ) : trend === 'down' ? (
              <TrendingDown className="mr-2 h-5 w-5 text-red-500" />
            ) : (
              <div className="mr-2 h-5 w-5"></div>
            )}
            <h2 className="text-lg font-semibold text-gray-700">LSTM Prediction (24h)</h2>
          </div>
          {loading || modelLoading ? (
            <div className="h-12 bg-gray-200 animate-pulse rounded"></div>
          ) : (
            <p className={`text-3xl font-bold ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {prediction ? formatCurrency(prediction) : 'N/A'}
            </p>
          )}
        </div>

        {/* Change Percentage Card */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center mb-2">
            <Calendar className="mr-2 h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-700">Predicted Change</h2>
          </div>
          {loading || modelLoading ? (
            <div className="h-12 bg-gray-200 animate-pulse rounded"></div>
          ) : (
            <p className={`text-3xl font-bold ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {prediction && historicalData.length > 0 ? (
                <>
                  {trend === 'up' ? '+' : ''}
                  {(((prediction - historicalData[historicalData.length - 1].price) / historicalData[historicalData.length - 1].price) * 100).toFixed(2)}%
                </>
              ) : 'N/A'}
            </p>
          )}
        </div>
      </div>

      {/* Price Chart */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Bitcoin Price History & Prediction</h2>
        {loading ? (
          <div className="h-64 bg-gray-100 animate-pulse rounded flex items-center justify-center">
            <p className="text-gray-500">Loading price data...</p>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date"
                  tickFormatter={(val) => {
                    if (timeframe === '7d') return val;
                    // For longer timeframes, show fewer labels
                    const idx = historicalData.findIndex(item => item.date === val);
                    return idx % (timeframe === '30d' ? 6 : 15) === 0 ? val : '';
                  }}
                />
                <YAxis 
                  domain={['dataMin - 1000', 'dataMax + 1000']}
                  tickFormatter={(val) => `$${Math.round(val / 1000)}k`}
                />
                <Tooltip 
                  formatter={(value) => [`${formatCurrency(value)}`, 'Price']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                  name="Historical Price"
                />
                {prediction && (
                  <Line 
                    type="monotone" 
                    dataKey={() => prediction}
                    stroke={trend === "up" ? "#10b981" : "#ef4444"}
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    dot={false}
                    activeDot={false}
                    name="LSTM Prediction"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Technical Analysis Section */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Model Analysis</h2>
        
        {loading || modelLoading ? (
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 animate-pulse rounded w-3/4"></div>
            <div className="h-6 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-6 bg-gray-200 animate-pulse rounded w-5/6"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">LSTM Forecast Signal</span>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                trend === 'up' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {trend === 'up' ? 'Bullish' : 'Bearish'}
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-gray-700">
                The LSTM neural network model has analyzed {timeframe} of historical BTC price data from Yahoo Finance. 
                Based on this analysis, the model predicts a {trend === 'up' ? 'positive' : 'negative'} price movement in the next 24 hours.
              </p>
              <p className="text-gray-700">
                {trend === 'up' 
                  ? 'Key technical indicators suggest a bullish momentum. The LSTM has identified patterns similar to previous upward trends.'
                  : 'Technical indicators are showing bearish signals. The LSTM has recognized patterns correlated with previous price declines.'}
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                <strong>Model Details:</strong> This prediction uses a Long Short-Term Memory (LSTM) neural network trained on historical Bitcoin price data. The model was saved as best_model_lstm.h5 with data normalized using lstm_scaler_X.pkl and lstm_scaler_y.pkl.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                <strong>Disclaimer:</strong> This prediction is based on historical patterns and should not be considered as financial advice. Cryptocurrency markets are highly volatile, and all investments carry risk.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}