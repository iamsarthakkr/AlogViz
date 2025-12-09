export class min_priority_queue {
    private heap: { dist: number; id: number }[] = [];

    private swap(i: number, j: number) {
        const h = this.heap;
        const tmp = h[i];
        h[i] = h[j];
        h[j] = tmp;
    }

    private up(i: number) {
        const h = this.heap;
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (h[p].dist <= h[i].dist) break;
            this.swap(i, p);
            i = p;
        }
    }

    private down(i: number) {
        const h = this.heap;
        const n = h.length;
        while (true) {
            const left = (i << 1) + 1;
            const right = left + 1;
            let smallest = i;

            if (left < n && h[left].dist < h[smallest].dist) smallest = left;
            if (right < n && h[right].dist < h[smallest].dist) smallest = right;
            if (smallest === i) break;
            this.swap(i, smallest);
            i = smallest;
        }
    }

    push(dist: number, id: number) {
        this.heap.push({ dist, id });
        this.up(this.heap.length - 1);
    }

    pop(): { dist: number; id: number } | null {
        const h = this.heap;
        if (!h.length) return null;
        const top = h[0];
        const last = h.pop()!;
        if (h.length) {
            h[0] = last;
            this.down(0);
        }
        return top;
    }

    size() {
        return this.heap.length;
    }

    empty() {
        return this.heap.length === 0;
    }
}
