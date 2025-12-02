export function createEmptyBoard(sizeX, sizeY) {
  const horizontal = Array.from({ length: sizeY + 1 }, () =>
    Array.from({ length: sizeX }, () => -1)
  );
  const vertical = Array.from({ length: sizeX + 1 }, () =>
    Array.from({ length: sizeY }, () => -1)
  );
  const boxes = Array.from({ length: sizeY }, () =>
    Array.from({ length: sizeX }, () => -1)
  );

  return {
    sizeX,
    sizeY,
    lines: { horizontal, vertical },
    boxes,
  };
}

export function cloneBoard(board) {
  return {
    sizeX: board.sizeX,
    sizeY: board.sizeY,
    lines: {
      horizontal: board.lines.horizontal.map((row) => [...row]),
      vertical: board.lines.vertical.map((column) => [...column]),
    },
    boxes: board.boxes.map((row) => [...row]),
  };
}

export function isLineClaimed(board, dir, x, y) {
  const normalized = normalizeDirection(dir);
  if (normalized === 'h') {
    return board.lines.horizontal[y][x] !== -1;
  }
  return board.lines.vertical[x][y] !== -1;
}

export function applyMove(board, move) {
  const normalized = normalizeDirection(move.dir);
  const nextBoard = cloneBoard(board);
  const owner = move.player;

  if (normalized === 'h') {
    if (nextBoard.lines.horizontal[move.y][move.x] !== -1) {
      return { board: board, completedBoxes: [] };
    }
    nextBoard.lines.horizontal[move.y][move.x] = owner;
  } else {
    if (nextBoard.lines.vertical[move.x][move.y] !== -1) {
      return { board: board, completedBoxes: [] };
    }
    nextBoard.lines.vertical[move.x][move.y] = owner;
  }

  const completedBoxes = [];
  const adjacent = getAdjacentBoxes(normalized, move.x, move.y, board.sizeX, board.sizeY);
  adjacent.forEach(({ x, y }) => {
    if (nextBoard.boxes[y][x] !== -1) {
      return;
    }
    if (isBoxCompleted(nextBoard.lines, x, y)) {
      nextBoard.boxes[y][x] = owner;
      completedBoxes.push({ x, y });
    }
  });

  return { board: nextBoard, completedBoxes };
}

export function createInitialGameState(sizeX, sizeY) {
  return {
    ...createEmptyBoard(sizeX, sizeY),
    currentPlayer: 0,
    scores: [0, 0],
    moves: [],
    isFinished: false,
    winner: null,
  };
}

export function playMove(state, dir, x, y) {
  if (state.isFinished) return state;
  if (isLineClaimed(state, dir, x, y)) return state;

  const move = { dir, x, y, player: state.currentPlayer };
  const { board, completedBoxes } = applyMove(state, move);

  const scores = [...state.scores];
  if (completedBoxes.length > 0) {
    scores[state.currentPlayer] += completedBoxes.length;
  }

  const totalBoxes = board.sizeX * board.sizeY;
  const claimedBoxes = board.boxes.reduce(
    (acc, row) => acc + row.filter((owner) => owner !== -1).length,
    0
  );

  const isFinished = claimedBoxes === totalBoxes;
  let winner = null;
  if (isFinished) {
    if (scores[0] === scores[1]) {
      winner = 'draw';
    } else {
      winner = scores[0] > scores[1] ? 0 : 1;
    }
  }

  return {
    ...board,
    currentPlayer: completedBoxes.length > 0 ? state.currentPlayer : 1 - state.currentPlayer,
    scores,
    moves: [...state.moves, move],
    isFinished,
    winner,
  };
}

function normalizeDirection(dir) {
  if (dir === 0 || dir === '0' || dir === 'h' || dir === 'H') return 'h';
  if (dir === 1 || dir === '1' || dir === 'v' || dir === 'V') return 'v';
  throw new Error(`Unknown direction: ${dir}`);
}

function getAdjacentBoxes(dir, x, y, sizeX, sizeY) {
  const boxes = [];
  if (dir === 'h') {
    if (y > 0) boxes.push({ x, y: y - 1 });
    if (y < sizeY) boxes.push({ x, y });
  } else {
    if (x > 0) boxes.push({ x: x - 1, y });
    if (x < sizeX) boxes.push({ x, y });
  }
  return boxes;
}

function isBoxCompleted(lines, x, y) {
  const top = lines.horizontal[y][x] !== -1;
  const bottom = lines.horizontal[y + 1][x] !== -1;
  const left = lines.vertical[x][y] !== -1;
  const right = lines.vertical[x + 1][y] !== -1;
  return top && bottom && left && right;
}
