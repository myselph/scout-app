# Scout App

This is a web application for the [Scout card game](https://oinkgames.com/en/games/analog/scout/) that I wrote to play against AI players. I am not affiliated with Oink Games in any way nor hold any rights to Scout; I merely enjoy playing the game and wanted build a strong AI player out of curiosity.
This repository contains

1. A Vite+React frontend for rendering game state and capturing user actions
2. A Flask backend that provides HTTP endpoints for game state management and move execution

The game engine lives in a [separate repository](https://github.com/myselph/scout-ai) that is a dependency of the backend. This allows me to work on the game engine - notably, model training and evaluation - separately from this web app.

## Running the App Locally

To run this, install
- Python 3.9+
- Node.js (v18+)
- npm

Then start the frontend and the backend, and navigate to `http://localhost:5173`.

### Running the Backend

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

### Running the Frontend

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


## Deploying to Vercel

For Vercel deployment, I use a monorepo deployment; that is, I added two projects, one for the frontend and one for the backend, and I set an environment variable `VITE_BACKEND_URL` in the frontend project to point to the backend URL (hardcoded on vercel UI). When this variable isn't set, the frontend will default to `http://localhost:5000`. Besides that,
there are no Vercel-specific dependencies or configurations. This could probably be improved a bunch (eg using the
"related projects" functionality of Vercel to set the backend URL automatically, or having both frontend+backend share the
same domain & use relative paths), but will do for now.

## TODO

1. The reason why a game ended should be displayed in the Game Over dialog; currently, when a game ends due to N-1 scouts in a row, the dialog just says "Game Over" and it's not obvious why since all players still hold cards.
1. The initial landing page should display an error if it cannot reach the backend.
1. For N players, Scout consists of N rounds, each with a different dealer; but the web app is currently limited to letting the human player be the dealer.


