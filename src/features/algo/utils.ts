import { Coord } from '@/types/grid';

export const equal = (a: Coord, b: Coord) => a.r === b.r && a.c === b.c;

export const neighbors4 = (p: Coord): Coord[] => {
    const dr = [-1, 1, 0, 0];
    const dc = [0, 0, -1, 1];
    const out: Coord[] = [];
    for (let k = 0; k < 4; k++) out.push({ r: p.r + dr[k], c: p.c + dc[k] });
    return out;
};
