# Scout App

This is a web application for the [Scout card game](https://oinkgames.com/en/games/analog/scout/) that I wrote to play against AI players. I am not affiliated with Oink Games in any way nor hold any rights to Scout; I merely enjoy playing the game and wanted build a strong AI player out of curiosity.
This repository contains

1. A Vite+React frontend for rendering game state and capturing user actions
2. A Flask backend that provides HTTP endpoints for game state management and move execution

The game engine lives in a [separate repository](https://github.com/myselph/scout-ai) that is a dependency of the backend. This allows me to work on the game engine - notably, model training and evaluation - separately from this web app.

## Running the App Locally

To run this, you'll need Python, node, npm.
Then I suggest to create a Python venv

```bash
python -m venv .venv
source .venv/bin/activate
```

Then install the frontend and backend dependencies, see below.

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

### Running both backend and frontend

If you've already installed all the dependencies, the `dev.sh` script is a simple way to just stop, start or restart the servers.


## Deploying to Vercel

For Vercel deployment, I use a monorepo deployment; that is, I added two projects, one for the frontend and one for the backend, and I set an environment variable `VITE_BACKEND_URL` in the frontend project to point to the backend URL (hardcoded on vercel UI). When this variable isn't set, the frontend will default to `http://localhost:5000`. Besides that,
there are no Vercel-specific dependencies or configurations. This could probably be improved a bunch (eg using the
"related projects" functionality of Vercel to set the backend URL automatically, or having both frontend+backend share the
same domain & use relative paths), but will do for now.
I also use Redis/Upstash for state management; this required configuring a Redis instance on the dashboard and connecting
it to the backend project; that will then set the REDIS_URL and other environment variables. Use Python's logging module
to get logs on the Vercel dashboard (print() does not show up) and ensure everything works.

## Adding new AI players

1. Implement a new Player subclass - see [scout-ai](https://github.com/myselph/scout-ai) repo, [players.py](https://github.com/myselph/scout-ai/blob/main/scout_ai/players.py), and take some inspiration from [PlanningPlayer](https://github.com/myselph/scout-ai/blob/main/scout_ai/players.py#L10-L207) or any of the other examples.
2. Import that player in the backend' [server.py](https://github.com/myselph/scout-app/blob/main/backend/server.py) - scout-app repo - and add it to the [SUPPORTED_PLAYERS](https://github.com/myselph/scout-app/blob/main/backend/server.py#L11-L13) dict. 
3. (Re)start servers (see above) or redeploy -> the frontend dropdown menu should contain your player.

## TODO

1. Code cleanup: MultiRoundGameState is a somewhat unfortunate mess, because it was tacked onto GameState. Specifically, its state is not always consistent with GameState's state, e.g. its cumulative scores do not update automatically when a game ends; that requires separate calls.
But that is leading to a bunch of confusion in the backend, and also frontend. Specifically, it is unclear when the scores in MultiRoundGameState
should be updated: as soon as a game is over? When next_round() is called? I think the best solution would be to go through MultiRoundGameState
and not access GameState directly, but that of course requires a whole bunch of boilerplate redirect code and changes to server.py
1. NeuralPlayer support. Torch is too large to install on vercel.

