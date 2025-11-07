import React, { useMemo, useState } from 'react';
import BoardSVG from './BoardSVG.jsx';
import { createInitialGameState, playMove } from '../logic/gameUtils.js';

const DEFAULT_SIZE = { x: 5, y: 5 };

function SinglePlayerGame() {
  const [gameState, setGameState] = useState(() =>
    createInitialGameState(DEFAULT_SIZE.x, DEFAULT_SIZE.y)
  );

  const handleLineClick = (dir, x, y) => {
    setGameState((prev) => playMove(prev, dir, x, y));
  };

  const resetGame = () => {
    setGameState(createInitialGameState(DEFAULT_SIZE.x, DEFAULT_SIZE.y));
  };

  const statusMessage = useMemo(() => {
    if (gameState.isFinished) {
      if (gameState.winner === 'draw') {
        return '무승부입니다!';
      }
      return `플레이어 ${gameState.winner + 1} 승리!`;
    }
    return `현재 차례: 플레이어 ${gameState.currentPlayer + 1}`;
  }, [gameState]);

  return (
    <div>
      <div className="game-status">
        <p>{statusMessage}</p>
      </div>
      <div className="scoreboard">
        <div>
          <div className="player-label" style={{ color: '#e74c3c' }}>
            플레이어 1
          </div>
          <div>{gameState.scores[0]} 점</div>
        </div>
        <div>
          <div className="player-label" style={{ color: '#3498db' }}>
            플레이어 2
          </div>
          <div>{gameState.scores[1]} 점</div>
        </div>
      </div>

      <BoardSVG
        sizeX={gameState.sizeX}
        sizeY={gameState.sizeY}
        lines={gameState.lines}
        boxes={gameState.boxes}
        onLineClick={handleLineClick}
      />

      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <button type="button" onClick={resetGame}>
          다시 시작
        </button>
      </div>
    </div>
  );
}

export default SinglePlayerGame;
