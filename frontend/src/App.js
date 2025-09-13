import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Activity, Heart, AlertTriangle, CheckCircle, Loader, Info, Download, Upload, RotateCcw } from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://breastcancer-4cit.onrender.com';

function App() {
  const [features, setFeatures] = useState({});
  const [featureNames, setFeatureNames] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);

  // Feature groups for better organization
  const featureGroups = {
    'Mean Values': [
      'mean radius', 'mean texture', 'mean perimeter', 'mean area',
      'mean smoothness', 'mean compactness', 'mean concavity',
      'mean concave points', 'mean symmetry', 'mean fractal dimension'
    ],
    'Standard Error': [
      'radius error', 'texture error', 'perimeter error', 'area error',
      'smoothness error', 'compactness error', 'concavity error',
      'concave points error', 'symmetry error', 'fractal dimension error'
    ],
    'Worst Values': [
      'worst radius', 'worst texture', 'worst perimeter', 'worst area',
      'worst smoothness', 'worst compactness', 'worst concavity',
      'worst concave points', 'worst symmetry', 'worst fractal dimension'
    ]
  };

  // Sample data for testing - using realistic values from Wisconsin Breast Cancer Dataset
  const sampleData = {
    'mean radius': 12.46,
    'mean texture': 24.04,
    'mean perimeter': 83.97,
    'mean area': 475.9,
    'mean smoothness': 0.1186,
    'mean compactness': 0.2396,
    'mean concavity': 0.2273,
    'mean concave points': 0.101,
    'mean symmetry': 0.1823,
    'mean fractal dimension': 0.05943,
    'radius error': 0.237,
    'texture error': 2.011,
    'perimeter error': 1.66,
    'area error': 23.87,
    'smoothness error': 0.007499,
    'compactness error': 0.00889,
    'concavity error': 0.009426,
    'concave points error': 0.01168,
    'symmetry error': 0.007041,
    'fractal dimension error': 0.001789,
    'worst radius': 14.49,
    'worst texture': 30.37,
    'worst perimeter': 97.9,
    'worst area': 567.7,
    'worst smoothness': 0.1739,
    'worst compactness': 0.4245,
    'worst concavity': 0.4504,
    'worst concave points': 0.243,
    'worst symmetry': 0.3613,
    'worst fractal dimension': 0.08758
  };

  useEffect(() => {
    fetchFeatureNames();
    fetchModelInfo();
  }, []);

  // Validate form whenever features change
  useEffect(() => {
    const allFilled = Object.values(features).every(value => {
      if (value === '') return false;
      const numValue = parseFloat(value);
      return !isNaN(numValue) && isFinite(numValue);
    });
    setIsFormValid(allFilled && Object.keys(features).length === 30);
  }, [features]);

  const fetchFeatureNames = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/features`);
      setFeatureNames(response.data.features);
      
      // Initialize features with default values
      const initialFeatures = {};
      response.data.features.forEach(feature => {
        initialFeatures[feature] = '';
      });
      setFeatures(initialFeatures);
    } catch (err) {
      setError('Failed to load feature names');
    }
  };

  const fetchModelInfo = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/model-info`);
      setModelInfo(response.data);
    } catch (err) {
      console.error('Failed to fetch model info:', err);
    }
  };

  const handleInputChange = (feature, value) => {
    setFeatures(prev => ({
      ...prev,
      [feature]: value
    }));
  };

  const loadSampleData = useCallback(() => {
    setFeatures(sampleData);
    setError(null);
    setPrediction(null);
  }, []);

  const clearForm = useCallback(() => {
    const emptyFeatures = {};
    featureNames.forEach(feature => {
      emptyFeatures[feature] = '';
    });
    setFeatures(emptyFeatures);
    setError(null);
    setPrediction(null);
  }, [featureNames]);

  const exportData = useCallback(() => {
    const dataStr = JSON.stringify(features, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'breast-cancer-data.json';
    link.click();
    URL.revokeObjectURL(url);
  }, [features]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isFormValid) {
      setError('Please fill in all fields with valid numbers');
      return;
    }
    
    setLoading(true);
    setError(null);
    setPrediction(null);

    try {
      // Convert features to array in the correct order
      const featureArray = featureNames.map(name => parseFloat(features[name]) || 0);
      
      const response = await axios.post(`${API_BASE_URL}/api/predict`, {
        features: featureArray
      });

      setPrediction(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  const renderFeatureInputs = (groupName, featureList) => (
    <div key={groupName} className="feature-group">
      <h3>{groupName}</h3>
      <div className="feature-inputs">
        {featureList.map(feature => {
          const value = features[feature] || '';
          const numValue = parseFloat(value);
          const isValid = value === '' || (!isNaN(numValue) && isFinite(numValue));
          const isEmpty = value === '';
          
          return (
            <div key={feature} className="form-group">
              <label htmlFor={feature}>
                {feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                {!isEmpty && !isValid && <span style={{ color: 'var(--error-color)', marginLeft: '4px' }}>*</span>}
              </label>
              <input
                type="number"
                id={feature}
                step="0.000001"
                value={value}
                onChange={(e) => handleInputChange(feature, e.target.value)}
                placeholder="Enter value"
                className={!isEmpty && !isValid ? 'invalid' : ''}
                title={!isEmpty && !isValid ? 'Please enter a valid number' : ''}
              />
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="container">
      <header className="header">
        <h1><Heart className="inline-icon" /> Breast Cancer Detection</h1>
        <p>AI-powered diagnostic tool using machine learning</p>
      </header>

      <div className="card">
        <h2 style={{ marginBottom: '20px', color: '#333' }}>
          <Activity className="inline-icon" /> Enter Patient Data
        </h2>
        
        {modelInfo && (
          <div style={{ 
            background: 'linear-gradient(135deg, #e8f4fd 0%, #ffffff 100%)', 
            padding: '20px', 
            borderRadius: '12px', 
            marginBottom: '24px',
            border: '2px solid #bee5eb',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Info className="inline-icon" style={{ color: '#3b82f6' }} />
              <strong style={{ color: '#1e40af' }}>Model Information</strong>
            </div>
            <p style={{ marginBottom: '8px', color: '#374151' }}>{modelInfo.description}</p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <span style={{ color: '#6b7280' }}><strong>Features:</strong> {modelInfo.features_count}</span>
              <span style={{ color: '#6b7280' }}><strong>Model Type:</strong> {modelInfo.model_type}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          marginBottom: '24px', 
          flexWrap: 'wrap',
          justifyContent: 'center',
          width: '100%',
          overflow: 'hidden'
        }}>
          <button 
            type="button"
            onClick={loadSampleData}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            <Upload className="inline-icon" size={16} />
            Load Sample Data
          </button>
          
          <button 
            type="button"
            onClick={clearForm}
            style={{
              background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
              color: 'white',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            <RotateCcw className="inline-icon" size={16} />
            Clear Form
          </button>
          
          <button 
            type="button"
            onClick={exportData}
            disabled={!isFormValid}
            style={{
              background: isFormValid ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : '#e5e7eb',
              color: isFormValid ? 'white' : '#9ca3af',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '8px',
              cursor: isFormValid ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
            onMouseOver={(e) => isFormValid && (e.target.style.transform = 'translateY(-2px)')}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            <Download className="inline-icon" size={16} />
            Export Data
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="features-grid">
            {Object.entries(featureGroups).map(([groupName, featureList]) =>
              renderFeatureInputs(groupName, featureList)
            )}
          </div>

          <button 
            type="submit" 
            className="button"
            disabled={loading || !isFormValid}
          >
            {loading ? (
              <>
                <Loader className="inline-icon" style={{ animation: 'spin 1s linear infinite' }} />
                Analyzing...
              </>
            ) : (
              <>
                <Activity className="inline-icon" />
                Analyze Patient Data
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="error">
            <AlertTriangle className="inline-icon" />
            {error}
          </div>
        )}
      </div>

      {prediction && (
        <div className={`result-card ${prediction.prediction === 0 ? 'result-malignant' : 'result-benign'}`}>
          <div className="result-title">
            {prediction.prediction === 0 ? (
              <>
                <AlertTriangle className="inline-icon" />
                Malignant
              </>
            ) : (
              <>
                <CheckCircle className="inline-icon" />
                Benign
              </>
            )}
          </div>
          
          <p style={{ fontSize: '1.1rem', marginBottom: '20px', color: '#666' }}>
            Confidence: {prediction.confidence}%
          </p>

          <div className="confidence-bar">
            <div 
              className={`confidence-fill ${prediction.prediction === 0 ? 'confidence-malignant' : 'confidence-benign'}`}
              style={{ width: `${prediction.confidence}%` }}
            />
          </div>

          <div className="probability-grid">
            <div className={`probability-item ${prediction.prediction === 0 ? 'probability-malignant' : ''}`}>
              <h4 style={{ color: '#e74c3c', marginBottom: '10px' }}>Malignant</h4>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#e74c3c' }}>
                {prediction.probabilities.malignant}%
              </div>
            </div>
            <div className={`probability-item ${prediction.prediction === 1 ? 'probability-benign' : ''}`}>
              <h4 style={{ color: '#27ae60', marginBottom: '10px' }}>Benign</h4>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#27ae60' }}>
                {prediction.probabilities.benign}%
              </div>
            </div>
          </div>

          <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            background: '#f8f9fa', 
            borderRadius: '8px',
            fontSize: '0.9rem',
            color: '#666'
          }}>
            <strong>Disclaimer:</strong> This is a machine learning model for educational purposes. 
            Always consult with medical professionals for actual diagnosis.
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
