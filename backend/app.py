from flask import Flask, request, jsonify
from flask_cors import CORS
import yfinance as yf
import numpy as np
import pandas as pd
import pickle
import datetime
import os
import sys
import time
import requests
import tensorflow as tf
from sklearn.preprocessing import MinMaxScaler

app = Flask(__name__)
# Configure CORS to allow all origins
CORS(app, resources={r"/api/*": {"origins": "*"}})

def fetch_bitcoin_data(period='7d', max_retries=3):
    """Fetch Bitcoin data with retry mechanism"""
    for attempt in range(max_retries):
        try:
            print(f"Attempt {attempt + 1} to fetch Bitcoin data...")
            
            # Try using CoinGecko API first (more reliable)
            print("Trying CoinGecko API...")
            days = 7 if period == '7d' else 30 if period == '1mo' else 90
            url = f"https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days={days}"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                prices = data['prices']
                df = pd.DataFrame(prices, columns=['timestamp', 'price'])
                df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
                df.set_index('timestamp', inplace=True)
                df.rename(columns={'price': 'Close'}, inplace=True)
                print(f"Successfully fetched {len(df)} data points from CoinGecko")
                return df
            
            # If CoinGecko fails, try yfinance as fallback
            print("CoinGecko failed, trying yfinance...")
            btc = yf.Ticker("BTC-USD")
            data = btc.history(period=period)
            if not data.empty:
                print(f"Successfully fetched {len(data)} data points from yfinance")
                return data
            
            print(f"Attempt {attempt + 1} failed, waiting before retry...")
            time.sleep(2)  # Wait 2 seconds before retrying
        except Exception as e:
            print(f"Error in attempt {attempt + 1}: {str(e)}")
            if attempt < max_retries - 1:
                time.sleep(2)
            else:
                raise Exception(f"Failed to fetch Bitcoin data after {max_retries} attempts: {str(e)}")
    
    raise Exception("Failed to fetch Bitcoin data")

def load_model():
    """Load the pre-trained model"""
    try:
        print("Loading model...")
        model = tf.keras.models.load_model('models/best_model_lstm.h5', compile=False)
        print("Model loaded successfully")
        return model
    except Exception as e:
        print(f"Error loading model: {str(e)}")
        # Try loading with custom_objects to handle batch_shape
        try:
            print("Attempting to load model with custom_objects...")
            model = tf.keras.models.load_model('models/best_model_lstm.h5', 
                                             compile=False,
                                             custom_objects={'batch_shape': None})
            print("Model loaded successfully with custom_objects")
            return model
        except Exception as e2:
            print(f"Error loading model with custom_objects: {str(e2)}")
            return None

# Try to load TensorFlow and the model
try:
    # Load the saved model and scalers
    try:
        # Load model with custom_objects to handle any custom layers or configurations
        print("Attempting to load model...")
        # Try to load with custom_objects to handle any custom layers
        custom_objects = {}
        model = load_model()
        print("Model loaded successfully")
        
        print("Loading scalers...")
        with open('models/lstm_scaler_X.pkl', 'rb') as f:
            scaler_X = pickle.load(f)
        with open('models/lstm_scaler_y.pkl', 'rb') as f:
            scaler_y = pickle.load(f)
        print("Scalers loaded successfully")
        
        USE_TENSORFLOW = True
        print("TensorFlow model and scalers loaded successfully")
    except Exception as e:
        print(f"Error loading model: {e}")
        print("Please check if the model files exist in the models directory")
        print("Model path:", os.path.abspath('models/best_model_lstm.h5'))
        USE_TENSORFLOW = False
except ImportError as e:
    print(f"TensorFlow import error: {e}")
    print("Please make sure you have TensorFlow installed correctly.")
    print("Try installing with: pip install tensorflow==2.10.0")
    print("Or use a compatible Python version (3.7-3.10)")
    USE_TENSORFLOW = False

@app.route('/api/bitcoin/historical', methods=['GET'])
def get_historical_data():
    print("Received request for historical data")
    timeframe = request.args.get('timeframe', '7d')
    print(f"Timeframe requested: {timeframe}")
    
    # Convert timeframe to yfinance period
    if timeframe == '7d':
        period = '7d'
    elif timeframe == '30d':
        period = '1mo'
    else:
        period = '3mo'
    
    try:
        print(f"Fetching data with period: {period}")
        # Get historical data using our new function
        btc_data = fetch_bitcoin_data(period=period)
        
        # Format data for frontend
        formatted_data = []
        for date, row in btc_data.iterrows():
            formatted_data.append({
                'date': date.strftime('%Y-%m-%d'),
                'price': float(row['Close'])
            })
        
        print(f"Successfully formatted {len(formatted_data)} data points")
        return jsonify(formatted_data)
    except Exception as e:
        print(f"Error in get_historical_data: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        timeframe = data.get('timeframe', '1d')
        
        # Fetch historical data
        df = fetch_bitcoin_data(timeframe)
        if df is None or len(df) < 60:  # Need at least 60 data points for prediction
            return jsonify({'error': 'Insufficient data for prediction'}), 400
            
        # Prepare data for prediction
        scaler = MinMaxScaler()
        scaled_data = scaler.fit_transform(df[['Close']].values)
        
        # Create sequences for LSTM
        X = []
        for i in range(60, len(scaled_data)):
            X.append(scaled_data[i-60:i, 0])
        X = np.array(X)
        X = np.reshape(X, (X.shape[0], X.shape[1], 1))
        
        # Load model and make prediction
        model = load_model()
        if model is None:
            return jsonify({'error': 'Failed to load prediction model'}), 500
            
        prediction = model.predict(X[-1:])
        prediction = scaler.inverse_transform(prediction)[0][0]
        
        return jsonify({
            'prediction': float(prediction),
            'current_price': float(df['Close'].iloc[-1]),
            'timestamp': df.index[-1].strftime('%Y-%m-%d %H:%M:%S')
        })
        
    except Exception as e:
        print(f"Error in prediction: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)