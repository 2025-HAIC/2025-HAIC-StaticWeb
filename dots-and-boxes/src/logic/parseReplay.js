import { createEmptyBoard, applyMove } from './gameUtils.js';

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
  const frames = [board];

  moves.forEach((move) => {
    const result = applyMove(board, move);
    board = result.board;
    frames.push(result.board);
  });

  return {
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
}
