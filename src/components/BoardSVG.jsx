import React, { useMemo, useState, useRef } from 'react';

const PLAYER_LINE_COLORS = {
  0: '#e74c3c',
  1: '#3498db',
};

const PLAYER_BOX_COLORS = {
  0: '#f9d0cc',
  1: '#cfe7fb',
};

const DEFAULT_LINE_COLOR = '#d0d0d0';
// Use CSS variable so dot color can change with theme
const DOT_COLOR = 'var(--dot)';

function BoardSVG({ sizeX, sizeY, lines, boxes, onLineClick, attemptedLine }) {
  const hasInteraction = typeof onLineClick === 'function';
  const [hovered, setHovered] = useState(null);
  const viewBox = useMemo(
    () => `-0.5 -0.5 ${sizeX + 1} ${sizeY + 1}`,
    [sizeX, sizeY]
  );

  const svgRef = useRef(null);

  const clientToSvg = (clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const [vbX, vbY, vbW, vbH] = viewBox.split(' ').map(Number);
    const px = (clientX - rect.left) / rect.width;
    const py = (clientY - rect.top) / rect.height;
    return { x: vbX + px * vbW, y: vbY + py * vbH };
  };

  const findNearestLine = (mx, my) => {
    let best = null;
    const threshold = 0.36;

    // Horizontal segments: rows y=0..sizeY, x=0..sizeX-1
    const cx = Math.floor(mx);
    for (let dy = -1; dy <= 1; dy++) {
      const y = Math.round(my) + dy;
      if (y < 0 || y > sizeY) continue;
      for (let dx = -1; dx <= 1; dx++) {
        const x = cx + dx;
        if (x < 0 || x >= sizeX) continue;
        const projX = Math.max(x, Math.min(mx, x + 1));
        const d = Math.hypot(mx - projX, my - y);
        if (d <= threshold && (!best || d < best.dist)) best = { type: 'h', x, y, dist: d };
      }
    }

    // Vertical segments: cols x=0..sizeX, y=0..sizeY-1
    const cy = Math.floor(my);
    for (let dx = -1; dx <= 1; dx++) {
      const x = Math.round(mx) + dx;
      if (x < 0 || x > sizeX) continue;
      for (let dy = -1; dy <= 1; dy++) {
        const y = cy + dy;
        if (y < 0 || y >= sizeY) continue;
        const projY = Math.max(y, Math.min(my, y + 1));
        const d = Math.hypot(mx - x, my - projY);
        if (d <= threshold && (!best || d < best.dist)) best = { type: 'v', x, y, dist: d };
      }
    }

    return best;
  };

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
        // Use CSS variables for box fills so themes (dark/light) can override colors.
        return (
          <rect
            key={`box-${x}-${y}`}
            x={x}
            y={y}
            width={1}
            height={1}
            fill={`var(--box-player-${owner})`}
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
          <g key={`h-group-${x}-${y}`}>
            {/* hit handled via SVG-level math; visual thin line below */}
            {/* visible thin line */}
            <>
              {/* show attempted/violation line in a distinct color/weight if provided */}
              {attemptedLine && attemptedLine.type === 'h' && attemptedLine.x === x && attemptedLine.y === y ? (
                <line
                  key={`h-viol-${x}-${y}`}
                  x1={x}
                  y1={y}
                  x2={x + 1}
                  y2={y}
                  stroke="var(--violation-line)"
                  strokeWidth={0.22}
                  strokeLinecap="round"
                />
              ) : null}

              <line
              key={`h-${x}-${y}`}
              x1={x}
              y1={y}
              x2={x + 1}
              y2={y}
              stroke={owner === -1 || owner === undefined ? (hovered === `h-${x}-${y}` ? 'var(--hover-line)' : color) : color}
              strokeWidth={0.12}
              strokeLinecap="round"
              style={{ pointerEvents: 'none', transition: 'stroke 120ms ease' }}
            />
            </>
          </g>
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
          <g key={`v-group-${x}-${y}`}>
            {/* hit handled via SVG-level math; visual thin line below */}
            <>
              {attemptedLine && attemptedLine.type === 'v' && attemptedLine.x === x && attemptedLine.y === y ? (
                <line
                  key={`v-viol-${x}-${y}`}
                  x1={x}
                  y1={y}
                  x2={x}
                  y2={y + 1}
                  stroke="var(--violation-line)"
                  strokeWidth={0.22}
                  strokeLinecap="round"
                />
              ) : null}

              <line
              key={`v-${x}-${y}`}
              x1={x}
              y1={y}
              x2={x}
              y2={y + 1}
              stroke={owner === -1 || owner === undefined ? (hovered === `v-${x}-${y}` ? 'var(--hover-line)' : color) : color}
              strokeWidth={0.12}
              strokeLinecap="round"
              style={{ pointerEvents: 'none', transition: 'stroke 120ms ease' }}
            />
            </>
          </g>
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
    <div className="board-svg-wrapper" style={{ width: '100%', maxWidth: '640px', margin: '0 auto', display: 'flex', justifyContent: 'center' }}>
      <svg
        ref={svgRef}
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: 'auto', display: 'block' }}
        onMouseMove={(e) => {
          if (!hasInteraction) return;
          const p = clientToSvg(e.clientX, e.clientY);
          if (!p) return;
          const hit = findNearestLine(p.x, p.y);
          if (!hit) {
            setHovered(null);
            return;
          }
          if (hit.type === 'h') {
            const owner = lines?.horizontal?.[hit.y]?.[hit.x];
            if (owner === -1 || owner === undefined) setHovered(`h-${hit.x}-${hit.y}`);
            else setHovered(null);
          } else {
            const owner = lines?.vertical?.[hit.x]?.[hit.y];
            if (owner === -1 || owner === undefined) setHovered(`v-${hit.x}-${hit.y}`);
            else setHovered(null);
          }
        }}
        onMouseLeave={() => setHovered(null)}
        onClick={(e) => {
          if (!hasInteraction) return;
          const p = clientToSvg(e.clientX, e.clientY);
          if (!p) return;
          const hit = findNearestLine(p.x, p.y);
          if (!hit) return;
          if (hit.type === 'h') {
            const owner = lines?.horizontal?.[hit.y]?.[hit.x];
            if (owner === -1 || owner === undefined) handleHorizontalClick(hit.x, hit.y, owner);
          } else {
            const owner = lines?.vertical?.[hit.x]?.[hit.y];
            if (owner === -1 || owner === undefined) handleVerticalClick(hit.x, hit.y, owner);
          }
        }}
      >
        <g>{renderBoxes()}</g>
        <g>{renderHorizontalLines()}</g>
        <g>{renderVerticalLines()}</g>
        <g>{renderDots()}</g>
      </svg>
    </div>
  );
}

export default React.memo(BoardSVG);
