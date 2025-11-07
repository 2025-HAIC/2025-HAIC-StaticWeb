import React, { useMemo } from 'react';

const PLAYER_LINE_COLORS = {
  0: '#e74c3c',
  1: '#3498db',
};

const PLAYER_BOX_COLORS = {
  0: '#f9d0cc',
  1: '#cfe7fb',
};

const DEFAULT_LINE_COLOR = '#d0d0d0';
const DOT_COLOR = '#2c3e50';

function BoardSVG({ sizeX, sizeY, lines, boxes, onLineClick }) {
  const hasInteraction = typeof onLineClick === 'function';
  const viewBox = useMemo(
    () => `-0.5 -0.5 ${sizeX + 1} ${sizeY + 1}`,
    [sizeX, sizeY]
  );

  const renderBoxes = () => {
    if (!boxes) return null;
    return boxes.map((row, y) =>
      row.map((owner, x) => {
        if (owner === -1 || owner === undefined) {
          return (
            <rect
              key={`box-${x}-${y}`}
              x={x}
              y={y}
              width={1}
              height={1}
              fill="transparent"
            />
          );
        }
        return (
          <rect
            key={`box-${x}-${y}`}
            x={x}
            y={y}
            width={1}
            height={1}
            fill={PLAYER_BOX_COLORS[owner] || 'transparent'}
          />
        );
      })
    );
  };

  const handleHorizontalClick = (x, y, owner) => {
    if (hasInteraction && (owner === -1 || owner === undefined)) {
      onLineClick('h', x, y);
    }
  };

  const handleVerticalClick = (x, y, owner) => {
    if (hasInteraction && (owner === -1 || owner === undefined)) {
      onLineClick('v', x, y);
    }
  };

  const renderHorizontalLines = () => {
    if (!lines?.horizontal) return null;
    return lines.horizontal.map((row, y) =>
      row.map((owner, x) => {
        const color = owner === -1 || owner === undefined
          ? DEFAULT_LINE_COLOR
          : PLAYER_LINE_COLORS[owner] || DEFAULT_LINE_COLOR;
        return (
          <line
            key={`h-${x}-${y}`}
            x1={x}
            y1={y}
            x2={x + 1}
            y2={y}
            stroke={color}
            strokeWidth={0.12}
            strokeLinecap="round"
            onClick={() => handleHorizontalClick(x, y, owner)}
            style={{ cursor: hasInteraction && (owner === -1 || owner === undefined) ? 'pointer' : 'default' }}
          />
        );
      })
    );
  };

  const renderVerticalLines = () => {
    if (!lines?.vertical) return null;
    return lines.vertical.map((column, x) =>
      column.map((owner, y) => {
        const color = owner === -1 || owner === undefined
          ? DEFAULT_LINE_COLOR
          : PLAYER_LINE_COLORS[owner] || DEFAULT_LINE_COLOR;
        return (
          <line
            key={`v-${x}-${y}`}
            x1={x}
            y1={y}
            x2={x}
            y2={y + 1}
            stroke={color}
            strokeWidth={0.12}
            strokeLinecap="round"
            onClick={() => handleVerticalClick(x, y, owner)}
            style={{ cursor: hasInteraction && (owner === -1 || owner === undefined) ? 'pointer' : 'default' }}
          />
        );
      })
    );
  };

  const renderDots = () => {
    const dots = [];
    for (let y = 0; y <= sizeY; y += 1) {
      for (let x = 0; x <= sizeX; x += 1) {
        dots.push(
          <circle
            key={`dot-${x}-${y}`}
            cx={x}
            cy={y}
            r={0.16}
            fill={DOT_COLOR}
          />
        );
      }
    }
    return dots;
  };

  return (
    <svg
      viewBox={viewBox}
      width="100%"
      style={{ maxWidth: '640px', height: 'auto' }}
    >
      <g>{renderBoxes()}</g>
      <g>{renderHorizontalLines()}</g>
      <g>{renderVerticalLines()}</g>
      <g>{renderDots()}</g>
    </svg>
  );
}

export default React.memo(BoardSVG);
