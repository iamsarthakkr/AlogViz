import { Coord } from '@/types/grid';

export const random = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const shuffle = (a: Coord[]) => {
    for (let i = a.length - 1; i > 0; --i) {
        const j = random(0, i - 1);
        [a[i], a[j]] = [a[j], a[i]];
    }
};

export const equal = (a: Coord, b: Coord) => a.r === b.r && a.c === b.c;

const create_neighbors = (p: Coord, dr: number[], dc: number[]): Coord[] => {
    const out: Coord[] = [];
    for (let k = 0; k < dr.length; k++) out.push({ r: p.r + dr[k], c: p.c + dc[k] });
    return out;
};

export const neighbors4 = (p: Coord): Coord[] => {
    const dr = [-1, 0, 1, 0];
    const dc = [0, 1, 0, -1];
    return create_neighbors(p, dr, dc);
};

export const second_neighbors4 = (p: Coord): Coord[] => {
    const dr = [-2, 0, 2, 0];
    const dc = [0, 2, 0, -2];
    return create_neighbors(p, dr, dc);
};
