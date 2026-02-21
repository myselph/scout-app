import React from 'react';
import './GameOverModal.css';

/**
 * GameOverModal component
 * Modal displaying final scores and winner
 * 
 * @param {boolean} isOpen - Whether modal is open
 * @param {array} scores - Array of player scores
 * @param {string} finishedReason - The reason the game ended
 * @param {function} onNewGame - Handler for new game button
 */
function formatReason(reason) {
    if (!reason) return '';
    switch (reason) {
        case 'FINISHED_EMPTY_HANDS':
            return 'A player emptied their hand.';
        case 'FINISHED_TOO_MANY_SCOUTS':
            return 'A round completed without any Shows.';
        case 'FINISHED_TOO_MANY_STEPS':
            return 'Maximum number of moves reached.';
        default:
            return '';
    }
}

export default function GameOverModal({ isOpen, scores = [], finishedReason, onNewGame }) {
    if (!isOpen) return null;

    // Find winner (highest score)
    const maxScore = Math.max(...scores);
    const winnerIndex = scores.indexOf(maxScore);

    return (
        <div className="modal-overlay" data-testid="game-over-modal">
            <div className="modal-content">
                <h2>Game Over!</h2>

                {finishedReason && formatReason(finishedReason) && (
                    <div className="finished-reason" style={{ textAlign: 'center', marginBottom: '1rem', fontStyle: 'italic', color: 'var(--text-secondary, #666)' }}>
                        {formatReason(finishedReason)}
                    </div>
                )}

                <div className="scores-list">
                    {scores.map((score, index) => (
                        <div
                            key={index}
                            className={`score-row ${index === winnerIndex ? 'winner' : ''}`}
                            data-testid={`final-score-${index}`}
                        >
                            <span className="player-name">
                                {index === 0 ? 'You' : `Player ${index + 1}`}
                                {index === winnerIndex && ' 🏆'}
                            </span>
                            <span className="player-final-score">{score} points</span>
                        </div>
                    ))}
                </div>

                <div className="modal-buttons">
                    <button
                        className="modal-button primary"
                        onClick={onNewGame}
                        data-testid="game-over-new-game-button"
                    >
                        New Game
                    </button>
                </div>
            </div>
        </div>
    );
}
