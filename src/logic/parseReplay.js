import { createEmptyBoard, applyMove, cloneBoard, isLineClaimed } from './gameUtils.js';

function normalizeDirectionLocal(dir) {
  if (dir === 0 || dir === '0' || dir === 'h' || dir === 'H') return 'h';
  if (dir === 1 || dir === '1' || dir === 'v' || dir === 'V') return 'v';
  throw new Error(`Unknown direction: ${dir}`);
}

export default function parseReplay(encodedString) {
  if (!encodedString || typeof encodedString !== 'string') {
    throw new Error('Replay 데이터가 비어 있습니다.');
  }

  const values = encodedString
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .map((item) => Number.parseInt(item, 10));

  if (values.length < 2 || values.some(Number.isNaN)) {
    throw new Error('잘못된 숫자 형식입니다.');
  }

  const sizeX = values[0];
  const sizeY = values[1];
  if (sizeX <= 0 || sizeY <= 0) {
    throw new Error('보드 크기가 올바르지 않습니다.');
  }

  const remaining = values.slice(2);
  if (remaining.length % 4 !== 0) {
    throw new Error('이동 데이터의 길이가 올바르지 않습니다.');
  }

  const moves = [];
  for (let i = 0; i < remaining.length; i += 4) {
    moves.push({
      player: remaining[i],
      x: remaining[i + 1],
      y: remaining[i + 2],
      dir: remaining[i + 3],
    });
  }

  let board = createEmptyBoard(sizeX, sizeY);
  const frames = [cloneBoard(board)];
  let violation = null;

  for (let i = 0; i < moves.length; i += 1) {
    const move = moves[i];
    // validate direction and bounds
    let dir;
    try {
      dir = normalizeDirectionLocal(move.dir);
    } catch (e) {
      violation = { index: i, move, reason: 'invalid-direction', attempted: move, boardBefore: cloneBoard(board) };
      break;
    }

    // bounds check
    const x = move.x;
    const y = move.y;
    let outOfBounds = false;
    if (dir === 'h') {
      if (x < 0 || x >= sizeX || y < 0 || y > sizeY) outOfBounds = true;
    } else {
      if (x < 0 || x > sizeX || y < 0 || y >= sizeY) outOfBounds = true;
    }
    if (outOfBounds) {
      violation = { index: i, move, reason: 'out-of-bounds', attempted: move, boardBefore: cloneBoard(board) };
      break;
    }

    // already claimed?
    if (isLineClaimed(board, dir, x, y)) {
      violation = { index: i, move, reason: 'occupied', attempted: move, boardBefore: cloneBoard(board) };
      break;
    }

    const result = applyMove(board, move);
    board = result.board;
    frames.push(cloneBoard(board));
  }

  const out = {
    sizeX,
    sizeY,
    moves,
    frames: frames.map((frame) => ({
      sizeX: frame.sizeX,
      sizeY: frame.sizeY,
      lines: {
        horizontal: frame.lines.horizontal.map((row) => [...row]),
        vertical: frame.lines.vertical.map((column) => [...column]),
      },
      boxes: frame.boxes.map((row) => [...row]),
    })),
  };

  if (violation) {
    // determine winner: the player who attempted the illegal move loses
    const offender = violation.move.player;
    const winner = offender === 0 ? 1 : 0;
    out.violation = {
      index: violation.index,
      move: violation.move,
      reason: violation.reason,
      attempted: violation.attempted,
      boardBefore: {
        sizeX: violation.boardBefore.sizeX,
        sizeY: violation.boardBefore.sizeY,
        lines: {
          horizontal: violation.boardBefore.lines.horizontal.map((row) => [...row]),
          vertical: violation.boardBefore.lines.vertical.map((column) => [...column]),
        },
        boxes: violation.boardBefore.boxes.map((row) => [...row]),
      },
      winner,
    };
  }

  return out;
}
