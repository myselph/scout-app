# Scout App

This is a web application for the Scout card game, featuring a Flask backend and a Vite+React frontend. Current AI capabilities are implemented in the `ml` repository.

## Prerequisites

- Python 3.9+
- Node.js (v18+)
- npm

## Running the Backend

The backend is a Flask server that provides HTTP endpoints for game state management and move execution. It requires dependencies to be installed, including the `scout-engine` package from GitHub.

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment (recommended):
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the server:
   ```bash
   python server.py
   ```
   The backend will run on `http://localhost:5000`.

*Note: You can also explore `start.sh` or run the tests via `pytest test_server.py -v`.*

## Running the Frontend

The frontend is built with React and Vite. It connects to the backend API to render the game interface.

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the Node dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`.
