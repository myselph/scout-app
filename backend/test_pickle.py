import pickle
import sys
import os

from game_state import GameState
from players import PlanningPlayer

# Create game state
game_state = GameState(3, 0)
players = [None] + [PlanningPlayer() for _ in range(2)]

# Store session
session = {
    "game_state": game_state,
    "players": players,
}

try:
    data = pickle.dumps(session)
    loaded_session = pickle.loads(data)
    print("Pickle successful!")
    print(loaded_session["game_state"].num_players)
except Exception as e:
    print(f"Pickle failed: {e}")
