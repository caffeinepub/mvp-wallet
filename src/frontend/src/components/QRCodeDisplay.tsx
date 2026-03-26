import { useMemo } from "react";

interface QRCodeDisplayProps {
  value: string;
  size?: number;
}

function hashString(str: string): number[] {
  const arr: number[] = [];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  const seed = Math.abs(hash);
  for (let i = 0; i < 441; i++) {
    const val = Math.sin(seed * (i + 1) * 9301 + 49297) * 233280;
    arr.push(Math.abs(val % 2) < 1 ? 1 : 0);
  }
  return arr;
}

const GRID_SIZE = 21;
const OFFSET = 2;

function finderPattern(row: number, col: number): boolean {
  if (row < 7 && col < 7) {
    if (row === 0 || row === 6 || col === 0 || col === 6) return true;
    if (row >= 2 && row <= 4 && col >= 2 && col <= 4) return true;
    return false;
  }
  if (row < 7 && col >= GRID_SIZE - 7) {
    const c = col - (GRID_SIZE - 7);
    if (row === 0 || row === 6 || c === 0 || c === 6) return true;
    if (row >= 2 && row <= 4 && c >= 2 && c <= 4) return true;
    return false;
  }
  if (row >= GRID_SIZE - 7 && col < 7) {
    const r = row - (GRID_SIZE - 7);
    if (r === 0 || r === 6 || col === 0 || col === 6) return true;
    if (r >= 2 && r <= 4 && col >= 2 && col <= 4) return true;
    return false;
  }
  return false;
}

function isFinderRegion(row: number, col: number): boolean {
  if (row < 8 && col < 8) return true;
  if (row < 8 && col >= GRID_SIZE - 8) return true;
  if (row >= GRID_SIZE - 8 && col < 8) return true;
  return false;
}

function isTiming(row: number, col: number): boolean {
  if (row === 6 && col >= 8 && col <= GRID_SIZE - 9) return true;
  if (col === 6 && row >= 8 && row <= GRID_SIZE - 9) return true;
  return false;
}

function getCell(row: number, col: number, grid: number[]): boolean {
  if (finderPattern(row, col)) return true;
  if (isFinderRegion(row, col)) return false;
  if (isTiming(row, col)) return (row + col) % 2 === 0;
  return grid[row * GRID_SIZE + col] === 1;
}

type CellRect = { key: string; x: number; y: number; w: number };

export function QRCodeDisplay({ value, size = 200 }: QRCodeDisplayProps) {
  const grid = useMemo(() => hashString(value), [value]);
  const cellSize = size / 25;

  const cells = useMemo<CellRect[]>(() => {
    const result: CellRect[] = [];
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (getCell(row, col, grid)) {
          result.push({
            key: `c${row * GRID_SIZE + col}`,
            x: (col + OFFSET) * cellSize,
            y: (row + OFFSET) * cellSize,
            w: cellSize,
          });
        }
      }
    }
    return result;
  }, [grid, cellSize]);

  const viewSize = (GRID_SIZE + OFFSET * 2) * cellSize;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${viewSize} ${viewSize}`}
      role="img"
      aria-label="QR Code para pagamento Pix"
      style={{ background: "white", borderRadius: "8px" }}
    >
      {cells.map(({ key, x, y, w }) => (
        <rect key={key} x={x} y={y} width={w} height={w} fill="#111A2F" />
      ))}
    </svg>
  );
}
