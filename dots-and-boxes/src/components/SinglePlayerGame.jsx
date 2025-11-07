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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      <div className="scoreboard" style={{ width: '640px', maxWidth: '100%' }}>
        <div className={"player " + (gameState.currentPlayer === 0 ? 'player-current' : '')}>
          <div className="player-label" style={{ color: '#e74c3c', fontWeight: 700, fontSize: '1.05rem' }}>
            플레이어 1
          </div>
          <div className="player-score" style={{ fontSize: '1.4rem', fontWeight: 800 }}>{gameState.scores[0]} 점</div>
        </div>
        <div className={"player " + (gameState.currentPlayer === 1 ? 'player-current' : '')}>
          <div className="player-label" style={{ color: '#3498db', fontWeight: 700, fontSize: '1.05rem' }}>
            플레이어 2
          </div>
          <div className="player-score" style={{ fontSize: '1.4rem', fontWeight: 800 }}>{gameState.scores[1]} 점</div>
        </div>
      </div>

        <div className="singleplayer-board-wrapper">
        <BoardSVG
          sizeX={gameState.sizeX}
          sizeY={gameState.sizeY}
          lines={gameState.lines}
          boxes={gameState.boxes}
          onLineClick={handleLineClick}
        />
      </div>
        {/* status message (current turn or victory) shown below the board, above the restart button */}
        <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--muted)' }}>{statusMessage}</div>
        </div>

        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <button type="button" onClick={resetGame}>
            다시 시작
          </button>
        </div>
    </div>
  );
}

export default SinglePlayerGame;
