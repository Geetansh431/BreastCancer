from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import numpy as np
import pandas as pd
import sklearn.datasets
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
import joblib
import os

app = Flask(__name__)
CORS(app)

# Global variables for model and scaler
model = None
scaler = None
feature_names = None

def load_model():
    """Load or train the breast cancer detection model"""
    global model, scaler, feature_names
    
    # Load the breast cancer dataset
    breast_cancer_dataset = sklearn.datasets.load_breast_cancer()
    feature_names = breast_cancer_dataset.feature_names.tolist()
    
    # Create DataFrame
    data_frame = pd.DataFrame(breast_cancer_dataset.data, columns=breast_cancer_dataset.feature_names)
    data_frame['label'] = breast_cancer_dataset.target
    
    # Separate features and target
    X = data_frame.drop(columns='label', axis=1)
    Y = data_frame['label']
    
    # Split the data
    X_train, X_test, Y_train, Y_test = train_test_split(X, Y, test_size=0.2, random_state=2)
    
    # Scale the features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train the model
    model = LogisticRegression()
    model.fit(X_train_scaled, Y_train)
    
    # Save the model and scaler
    joblib.dump(model, 'model.pkl')
    joblib.dump(scaler, 'scaler.pkl')
    
    print("Model trained and saved successfully!")

@app.route('/')
def index():
    """Serve the main page"""
    return send_from_directory('../frontend/build', 'index.html')

@app.route('/api/features', methods=['GET'])
def get_features():
    """Get the list of feature names"""
    return jsonify({
        'features': feature_names,
        'count': len(feature_names)
    })

@app.route('/api/predict', methods=['POST'])
def predict():
    """Make a prediction based on input features"""
    try:
        data = request.get_json()
        
        if not data or 'features' not in data:
            return jsonify({'error': 'No features provided'}), 400
        
        features = data['features']
        
        if len(features) != 30:
            return jsonify({'error': f'Expected 30 features, got {len(features)}'}), 400
        
        # Convert to numpy array and reshape
        input_array = np.array(features).reshape(1, -1)
        
        # Scale the input
        input_scaled = scaler.transform(input_array)
        
        # Make prediction
        prediction = model.predict(input_scaled)[0]
        prediction_proba = model.predict_proba(input_scaled)[0]
        
        # Get confidence scores
        confidence = max(prediction_proba) * 100
        
        result = {
            'prediction': int(prediction),
            'label': 'Benign' if prediction == 1 else 'Malignant',
            'confidence': round(confidence, 2),
            'probabilities': {
                'malignant': round(prediction_proba[0] * 100, 2),
                'benign': round(prediction_proba[1] * 100, 2)
            }
        }
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/model-info', methods=['GET'])
def model_info():
    """Get information about the model"""
    return jsonify({
        'model_type': 'Logistic Regression',
        'features_count': 30,
        'classes': ['Malignant (0)', 'Benign (1)'],
        'description': 'Breast Cancer Detection Model trained on Wisconsin Breast Cancer Dataset'
    })

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'model_loaded': model is not None})

# Load model when app starts (regardless of how it's started)
print("Loading breast cancer detection model...")
load_model()
print("Model loaded successfully!")

if __name__ == '__main__':
    print("Starting Flask server...")
    app.run(debug=True, host='0.0.0.0', port=5000)
