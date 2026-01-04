# PocketPilot Ultimate

## Overview
PocketPilot Ultimate is a sophisticated financial forecasting application designed to help users track stock prices and generate predictions using machine learning. It features a modern, responsive web interface, a robust backend API, and a dedicated AI microservice for making accurate market predictions.

## Architecture
The application follows a microservices-inspired architecture:

### 1. Frontend (Web Client)
- **Framework**: Next.js (React)
- **Styling**: Tailwind CSS
- **Features**: 
  - Interactive dashboard for data visualization.
  - User authentication and management.
  - Responsive design for desktop and mobile.

### 2. Backend (API Gateway)
- **Runtime**: Node.js with Express
- **Database**: PostgreSQL
- **Key Functions**:
  - Handles user authentication (Registration, Login) securely with bcrypt and JWT.
  - CRUD operations for user data.
  - Acts as a proxy to the Forecast Service, sanitizing and forwarding prediction requests.

### 3. Forecast Service (AI/ML Engine)
- **Runtime**: Python 3 with FastAPI
- **ML Libraries**: Scikit-learn, NumPy, Pandas
- **Functionality**:
  - Exposes an HTTP API to generate stock price forecasts.
  - Uses pre-trained machine learning models (`.pkl` artifacts) to predict future trends based on historical data.

## Key Features
- **Stock Prediction**: Submit current market data to receive AI-powered price forecasts for specific time horizons.
- **Secure Access**: Protected routes and data ensuring user privacy.
- **Scalable Design**: Docker-ready services that can be deployed independently.
