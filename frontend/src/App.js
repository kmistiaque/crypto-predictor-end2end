import React from 'react';
import './App.css';
import PredictionChart from './components/PredictionChart';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Bitcoin Price Predictor</h1>
      </header>
      <main>
        <PredictionChart />
      </main>
    </div>
  );
}

export default App;
