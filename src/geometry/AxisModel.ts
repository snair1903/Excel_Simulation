export abstract class AxisModel {
    private readonly sizes: number[];
    private readonly prefixSums: number[];

    protected constructor(
        private readonly count: number,
        defaultSize: number,
        private readonly minSize: number,
    ) {
        this.sizes = new Array(count).fill(defaultSize);
        this.prefixSums = new Array(count + 1);
        this.rebuildPrefixSums();
    }

    private rebuildPrefixSums(): void {
        this.prefixSums[0] = 0;
        for (let i = 0; i < this.count; i++) {
            this.prefixSums[i + 1] = this.prefixSums[i]! + this.sizes[i]!;
        }
    }

    private regeneratePrefixSumsFrom(fromIndex: number): void {
        const start = Math.max(1, fromIndex);
        for (let i = start; i < this.count; i++) {
            this.prefixSums[i] = this.prefixSums[i - 1]! + this.sizes[i - 1]!;
        }
    }

    public getCount(): number {
        return this.count;
    }

    /** Current size (width or height, in px) of the given index. */
    public getSize(index: number): number {
        return this.sizes[index]!;
    }

    /** Pixel offset at which the given index starts. */
    public getStart(index: number): number {
        return this.prefixSums[index]!;
    }

    public getTotalSize(): number {
        return this.prefixSums[this.count - 1]! + this.sizes[this.count - 1]!;
    }

    /** Resizes a single index and incrementally repairs the prefix sums after it. */
    public setSize(index: number, size: number): void {
        this.sizes[index] = Math.max(this.minSize, size);
        this.regeneratePrefixSumsFrom(index + 1);
    }

    /** Binary search: which index contains the given pixel offset. Clamped to bounds. */
    public getIndexAtOffset(offset: number): number {
        let left = 0;
        let right = this.count - 1;

        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            const start = this.prefixSums[mid]!;
            const end = start + this.sizes[mid]!;

            if (offset < start) right = mid - 1;
            else if (offset >= end) left = mid + 1;
            else return mid;
        }

        return Math.max(0, Math.min(this.count - 1, left));
    }

    /**
     * Returns the index whose trailing border is within `tolerancePx` of the given
     * offset, or null. Used for resize-handle hit testing on header strips.
     */
    public getResizeBorderAtOffset(offset: number, tolerancePx: number): number | null {
        for (let i = 1; i <= this.count; i++) {
            const border = this.prefixSums[i]!;
            if (Math.abs(offset - border) <= tolerancePx) return i - 1;
            if (border > offset + tolerancePx) break;
        }
        return null;
    }
}
