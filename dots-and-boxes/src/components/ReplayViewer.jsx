import React, { useEffect, useMemo, useState } from 'react';
import parseReplay from '../logic/parseReplay.js';
import BoardSVG from './BoardSVG.jsx';

const PLAY_INTERVAL_MS = 500;

function ReplayViewer() {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState(null);
  const [replayData, setReplayData] = useState(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  const totalMoves = useMemo(() => {
    if (!replayData) return 0;
    return Math.max(0, replayData.frames.length - 1);
  }, [replayData]);

  useEffect(() => {
    if (!playing || !replayData) return undefined;
    const id = setInterval(() => {
      setFrameIndex((prev) => {
        if (prev >= totalMoves) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, PLAY_INTERVAL_MS);
    return () => clearInterval(id);
  }, [playing, replayData, totalMoves]);

  useEffect(() => {
    if (!replayData) return;
    if (frameIndex > totalMoves) {
      setFrameIndex(totalMoves);
      setPlaying(false);
    }
  }, [frameIndex, totalMoves, replayData]);

  const handleParse = () => {
    try {
      const parsed = parseReplay(inputValue);
      setReplayData(parsed);
      setFrameIndex(0);
      setPlaying(false);
      setError(null);
    } catch (e) {
      setError(e.message);
      setReplayData(null);
      setPlaying(false);
    }
  };

  const goToPrevious = () => {
    setFrameIndex((prev) => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setFrameIndex((prev) => Math.min(totalMoves, prev + 1));
  };

  const currentFrame = replayData ? replayData.frames[frameIndex] : null;

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <textarea
          placeholder="리플레이 데이터를 붙여넣으세요"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
        />
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button type="button" onClick={handleParse}>
            리플레이 불러오기
          </button>
          {replayData && (
            <button
              type="button"
              onClick={() => setPlaying((prev) => !prev)}
            >
              {playing ? '⏸ 일시정지' : '▶ 재생'}
            </button>
          )}
        </div>
        {error && (
          <p style={{ color: '#e74c3c', marginTop: '0.5rem' }}>{error}</p>
        )}
      </div>

      {replayData && currentFrame && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <BoardSVG
            sizeX={currentFrame.sizeX}
            sizeY={currentFrame.sizeY}
            lines={currentFrame.lines}
            boxes={currentFrame.boxes}
          />

          <div className="replay-controls">
            <button type="button" onClick={goToPrevious} disabled={frameIndex === 0}>
              ◀ 이전
            </button>
            <button type="button" onClick={goToNext} disabled={frameIndex >= totalMoves}>
              ▶ 다음
            </button>
            <input
              type="range"
              min={0}
              max={totalMoves}
              value={frameIndex}
              onChange={(event) => setFrameIndex(Number.parseInt(event.target.value, 10))}
            />
            <span className="turn-indicator">
              Turn {frameIndex} / {totalMoves}
            </span>
          </div>
          <div className="replay-status">
            <p>
              총 {totalMoves} 수 중 {frameIndex} 수를 재생 중입니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReplayViewer;
