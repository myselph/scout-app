import React, { useState, useEffect, useRef, useMemo } from 'react';
import ControlBar from './components/ControlBar';
import Table from './components/Table';
import PlayerRow from './components/PlayerRow';
import FlipHandModal from './components/FlipHandModal';
import GameOverModal from './components/GameOverModal';
import * as api from './api/client';
import {
  isValidScout,
  isValidShow,
  findScoutAndShowMove,
  computeTempHandAfterScout,
  hasScoutAndShowMoves
} from './utils/moveValidation';
import './App.css';

function App() {
  // Game state
  const [sessionId, setSessionId] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [possibleMoves, setPossibleMoves] = useState(null);
  // UI state
  const [playMode, setPlayMode] = useState('auto'); // 'auto' or 'manual'
  const [speed, setSpeed] = useState(1); // 1, 2, or 4
  const [debugMode, setDebugMode] = useState(false);
  const [showFlipModal, setShowFlipModal] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [showRoundOverModal, setShowRoundOverModal] = useState(false);
  const [opponentType, setOpponentType] = useState('PlanningPlayer');
  const [availableOpponents, setAvailableOpponents] = useState([]);

  // Fetch available opponents on mount
  useEffect(() => {
    async function fetchPlayers() {
      try {
        const data = await api.listPlayers();
        setAvailableOpponents(data.players || []);
        if (data.players && data.players.length > 0) {
          setOpponentType(prevType =>
            data.players.includes(prevType) ? prevType : data.players[0]
          );
        }
      } catch (error) {
        console.error('Failed to fetch players:', error);
      }
    }
    fetchPlayers();
  }, []);

  // Interaction state
  const [selectedTableCard, setSelectedTableCard] = useState(null); // {index, flip}
  const [selectedHandCards, setSelectedHandCards] = useState([]); // array of indices
  const [insertionPoints, setInsertionPoints] = useState([]); // array of indices
  const [scoutAndShowMode, setScoutAndShowMode] = useState(false);
  const [tempHand, setTempHand] = useState(null); // temporary hand during Scout & Show
  const [scoutMove, setScoutMove] = useState(null); // scout move during Scout & Show

  // Auto-advance timer
  const autoAdvanceTimer = useRef(null);

  // Clear interaction state
  const clearInteractionState = () => {
    setSelectedTableCard(null);
    setSelectedHandCards([]);
    setInsertionPoints([]);
    setScoutAndShowMode(false);
    setTempHand(null);
    setScoutMove(null);
  };

  // Fetch game state
  const fetchGameState = async () => {
    if (!sessionId) return;

    try {
      const data = await api.getState(sessionId);

      setGameState(data.multi_round_game_state);
      setPossibleMoves(data.possible_moves);

      // Check if game is finished or just the round
      if (data.multi_round_game_state.is_game_finished) {
        setShowGameOverModal(true);
      } else if (data.multi_round_game_state.round_state.is_finished) {
        setShowRoundOverModal(true);
      }
    } catch (error) {
      console.error('Failed to fetch game state:', error);
    }
  };

  // Start new game
  const handleNewGame = async (numPlayers = 4) => {
    try {
      // If called from a button click, numPlayers will be the event object
      // Check if it's a number, otherwise use default
      let isNewSequence = typeof numPlayers === 'number';
      const playerCount = isNewSequence ? numPlayers : (gameState ? gameState.num_players : 4);

      clearInteractionState();
      setShowGameOverModal(false);
      setShowRoundOverModal(false);

      // Create new game with specified number of players and opponent type
      const result = await api.newGame(playerCount, opponentType);
      setSessionId(result.session_id);

      // Fetch initial state
      const data = await api.getState(result.session_id);
      setGameState(data.multi_round_game_state);
      setPossibleMoves(null);

      // Show flip hand modal
      setShowFlipModal(true);
    } catch (error) {
      console.error('Failed to start new game:', error);
    }
  };

  // Handle flip hand decision
  const handleFlipHand = async (flip) => {
    try {
      await api.flipHand(sessionId, flip);
      setShowFlipModal(false);
      await fetchGameState();
    } catch (error) {
      console.error('Failed to flip hand:', error);
    }
  };

  // Advance game (AI or human move)
  const handleAdvance = async (move = null) => {
    try {
      await api.advance(sessionId, move);
      clearInteractionState();
      await fetchGameState();
    } catch (error) {
      console.error('Failed to advance game:', error);
    }
  };

  // Next Round wrapper
  const handleNextRound = async () => {
    try {
      setShowRoundOverModal(false);
      clearInteractionState();

      const res = await api.nextRound(sessionId);
      if (res.has_next_round) {
        // Now fetch state, and it should prompt the human to flip again
        await fetchGameState();
        setShowFlipModal(true);
      } else {
        setShowGameOverModal(true);
      }
    } catch (error) {
      console.error('Failed to start next round:', error);
    }
  };

  // Auto-advance for AI players
  useEffect(() => {
    if (!gameState || !sessionId) return;
    if (gameState.round_state.is_finished) return;
    if (playMode !== 'auto') return;
    if (gameState.round_state.current_player === 0) return; // Don't auto-advance for human
    if (showFlipModal) return; // Don't auto-advance while waiting for human to flip hand

    // Clear existing timer
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
    }

    // Speed delays in milliseconds: 1x=2s, 2x=0.5s, 4x=0.1s
    const delays = { 1: 2000, 2: 500, 4: 100 };
    const delay = delays[speed] || 2000;

    // Set timer for AI move
    autoAdvanceTimer.current = setTimeout(() => {
      handleAdvance(null);
    }, delay);

    return () => {
      if (autoAdvanceTimer.current) {
        clearTimeout(autoAdvanceTimer.current);
      }
    };
  }, [gameState, playMode, speed, sessionId, showFlipModal]);

  // Handle table card click (Scout mode)
  const handleTableCardClick = (index) => {
    if (scoutAndShowMode && scoutMove) return; // Already scouted in S&S mode

    const isFirst = index === 0;
    const isLast = index === gameState.round_state.table.length - 1;

    // If clicking non-eligible card (middle cards), cancel Scout
    if (!isFirst && !isLast) {
      clearInteractionState();
      return;
    }

    // Toggle selection or flip
    if (selectedTableCard && selectedTableCard.index === index) {
      // Toggle flip
      setSelectedTableCard({
        index,
        flip: !selectedTableCard.flip
      });
    } else {
      // Select card
      setSelectedTableCard({ index, flip: false });
      setSelectedHandCards([]);

      // Show insertion points
      const hand = tempHand || gameState.round_state.hands[0];
      setInsertionPoints([...Array(hand.length + 1).keys()]);
    }
  };

  // Handle table background click (cancel Scout)
  const handleTableBackgroundClick = () => {
    if (selectedTableCard || insertionPoints.length > 0) {
      clearInteractionState();
    }
  };

  // Handle insertion point click
  const handleInsertionPointClick = (insertPos) => {
    if (!selectedTableCard) return;

    const isFirst = selectedTableCard.index === 0;
    const flip = selectedTableCard.flip;

    if (scoutAndShowMode) {
      // Scout & Show mode: compute temp hand and enter Show mode
      const newTempHand = computeTempHandAfterScout(
        gameState.round_state.hands[0],
        gameState.round_state.table,
        isFirst,
        flip,
        insertPos
      );

      setTempHand(newTempHand);
      setScoutMove({ first: isFirst, flip, insertPos });
      setSelectedTableCard(null);
      setInsertionPoints([]);
    } else {
      // Regular Scout mode: execute move
      const move = {
        type: 'scout',
        first: isFirst,
        flip,
        insertPos
      };

      if (isValidScout(possibleMoves, isFirst, flip, insertPos)) {
        handleAdvance(move);
      }
    }
  };

  // Handle hand card click (Show mode)
  const handleHandCardClick = (index) => {
    setSelectedTableCard(null);
    setInsertionPoints([]);

    const newSelection = [...selectedHandCards];

    if (newSelection.includes(index)) {
      // Deselect
      newSelection.splice(newSelection.indexOf(index), 1);
    } else {
      // Select
      newSelection.push(index);
      newSelection.sort((a, b) => a - b);
    }

    setSelectedHandCards(newSelection);
  };

  // Handle Show button click
  const handleShowClick = () => {
    if (selectedHandCards.length === 0) return;

    // Check if selection is contiguous
    const sorted = [...selectedHandCards].sort((a, b) => a - b);
    const isContiguous = sorted.every((val, i) => i === 0 || val === sorted[i - 1] + 1);

    if (!isContiguous) return;

    const startPos = sorted[0];
    const length = sorted.length;

    if (scoutAndShowMode && scoutMove) {
      // Scout & Show mode: find matching composite move
      const compositeMove = findScoutAndShowMove(possibleMoves, scoutMove, startPos, length);

      if (compositeMove) {
        handleAdvance(compositeMove);
      }
    } else {
      // Regular Show mode
      const move = {
        type: 'show',
        startPos,
        length
      };

      if (isValidShow(possibleMoves, startPos, length)) {
        handleAdvance(move);
      }
    }
  };

  // Check if Show button should be visible
  const isShowButtonVisible = () => {
    if (selectedHandCards.length === 0) return false;

    const sorted = [...selectedHandCards].sort((a, b) => a - b);
    const isContiguous = sorted.every((val, i) => i === 0 || val === sorted[i - 1] + 1);

    if (!isContiguous) return false;

    const startPos = sorted[0];
    const length = sorted.length;

    if (scoutAndShowMode && scoutMove) {
      return findScoutAndShowMove(possibleMoves, scoutMove, startPos, length) !== null;
    } else {
      return isValidShow(possibleMoves, startPos, length);
    }
  };

  // Check if Scout & Show button should be visible
  const isScoutAndShowButtonVisible = () => {
    if (!possibleMoves) return false;
    if (gameState.round_state.current_player !== 0) return false;
    return hasScoutAndShowMoves(possibleMoves);
  };

  // Toggle Scout & Show mode
  const handleScoutAndShowToggle = () => {
    if (scoutAndShowMode) {
      // Cancel mode
      clearInteractionState();
    } else {
      // Enter mode
      clearInteractionState();
      setScoutAndShowMode(true);
    }
  };

  // Check if green checkmark should be visible (Scout mode)
  const isScoutConfirmVisible = () => {
    if (scoutAndShowMode && scoutMove) return false; // Already scouted
    if (!selectedTableCard) return false;
    if (insertionPoints.length === 0) return false;
    return true;
  };

  if (!gameState) {
    return (
      <div className="app">
        <div className="welcome">
          <h1>Scout Card Game</h1>

          <div className="opponent-selection-container" style={{ margin: '20px 0', textAlign: 'center' }}>
            <label htmlFor="opponent-select" style={{ color: 'white', marginRight: '10px' }}>Opponent Type:</label>
            <select
              id="opponent-select"
              value={opponentType}
              onChange={(e) => setOpponentType(e.target.value)}
              style={{ padding: '8px', borderRadius: '4px', background: '#333', color: 'white', border: '1px solid #555' }}
            >
              {availableOpponents.length > 0 ? (
                availableOpponents.map(opp => (
                  <option key={opp} value={opp}>{opp}</option>
                ))
              ) : (
                <option value={opponentType}>{opponentType}</option>
              )}
            </select>
          </div>

          <div className="player-count-buttons">
            <button
              className="start-button"
              onClick={() => handleNewGame(3)}
              data-testid="start-3player-button"
            >
              New 3-Player Game
            </button>
            <button
              className="start-button"
              onClick={() => handleNewGame(4)}
              data-testid="start-4player-button"
            >
              New 4-Player Game
            </button>
            <button
              className="start-button"
              onClick={() => handleNewGame(5)}
              data-testid="start-5player-button"
            >
              New 5-Player Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isHumanTurn = gameState.round_state.current_player === 0;
  const humanHand = tempHand || gameState.round_state.hands[0];

  // Compute display table (hide scouted card in Scout & Show mode)
  let displayTable = gameState.round_state.table;
  if (scoutAndShowMode && scoutMove) {
    // Determine which card was scouted (first = left edge, !first = right edge)
    const scoutedIndex = scoutMove.first ? 0 : gameState.round_state.table.length - 1;
    // Filter out the scouted card from display
    displayTable = gameState.round_state.table.filter((_, idx) => idx !== scoutedIndex);
  }

  return (
    <div className="app">
      <ControlBar
        onNewGame={handleNewGame}
        onStep={() => handleAdvance(null)}
        onPause={() => setPlayMode('manual')}
        onContinue={() => setPlayMode('auto')}
        onDebugToggle={() => setDebugMode(!debugMode)}
        onSpeedChange={() => setSpeed(prev => prev === 1 ? 2 : prev === 2 ? 4 : 1)}
        playMode={playMode}
        debugMode={debugMode}
        speed={speed}
      />

      <div className="game-area">
        <Table
          cards={displayTable}
          selectedIndex={selectedTableCard?.index}
          selectedCardFlip={selectedTableCard?.flip || false}
          onCardClick={isHumanTurn ? handleTableCardClick : null}
          onBackgroundClick={isHumanTurn ? handleTableBackgroundClick : null}
          isInteractive={isHumanTurn}
        />



        {/* Player rows */}
        <div className="players">
          {gameState.round_state.hands.map((hand, index) => (
            <PlayerRow
              key={index}
              playerIndex={index}
              playerClass={gameState.player_classes ? gameState.player_classes[index] : (index === 0 ? 'Human' : 'PlanningPlayer')}
              hand={index === 0 ? humanHand : hand}
              score={gameState.round_state.scores[index]}
              cumScore={gameState.cum_scores[index]}
              isDealer={gameState.dealer === index}
              canScoutAndShow={gameState.round_state.can_scout_and_show[index]}
              isHuman={index === 0}
              isCurrentPlayer={gameState.round_state.current_player === index}
              debugMode={debugMode}
              selectedIndices={index === 0 ? selectedHandCards : []}
              onCardClick={index === 0 && isHumanTurn ? handleHandCardClick : null}
              insertionPoints={index === 0 ? insertionPoints : []}
              onInsertionPointClick={index === 0 && isHumanTurn ? handleInsertionPointClick : null}
              showShowButton={index === 0 && isShowButtonVisible()}
              onShowClick={handleShowClick}
              showScoutAndShowButton={index === 0 && isScoutAndShowButtonVisible()}
              scoutAndShowActive={scoutAndShowMode}
              onScoutAndShowClick={handleScoutAndShowToggle}
            />
          ))}
        </div>
      </div>

      <FlipHandModal
        isOpen={showFlipModal}
        hand={gameState.round_state.hands[0]}
        onFlip={handleFlipHand}
      />

      <GameOverModal
        isOpen={showRoundOverModal}
        scores={gameState.round_state.scores}
        finishedReason={gameState.round_state.finished_reason}
        onNewGame={handleNextRound}
        title="Round Over"
        buttonText="Next Round"
      />

      <GameOverModal
        isOpen={showGameOverModal}
        scores={gameState.cum_scores}
        finishedReason={gameState.round_state.finished_reason}
        onNewGame={handleNewGame}
        title="Game Over"
        buttonText="New Game"
      />
    </div>
  );
}

export default App;
