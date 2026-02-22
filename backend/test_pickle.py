import pickle
import sys
import os
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

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
    logging.info("Pickle successful!")
    logging.info(loaded_session["game_state"].num_players)
except Exception as e:
    logging.error(f"Pickle failed: {e}")
