import type { RangeSummary, SelectionRange } from "../models/Types.js";
import { GridDataStore } from "../data/GridDataStore.js";

/**
 * Computes count/min/max/sum/average for the numeric cells inside a
 * SelectionRange. Kept separate from GridDataStore so storage and
 * aggregation can evolve independently (e.g. a future cached/incremental
 * SummaryCalculator would not need to touch storage code).
 *
 * Cost is proportional to the number of *populated* cells inside the
 * selected range (via GridDataStore.forEachValueInRange), not to the size of
 * the full grid - selecting the whole sheet only visits cells that actually
 * have values.
 */
export class SummaryCalculator {
    constructor(private readonly dataStore: GridDataStore) {}

    public calculate(range: SelectionRange): RangeSummary {
        let count = 0;
        let sum = 0;
        let min = Number.POSITIVE_INFINITY;
        let max = Number.NEGATIVE_INFINITY;

        this.dataStore.forEachValueInRange(
            range.startRow,
            range.startColumn,
            range.endRow,
            range.endColumn,
            (_row, _col, rawValue) => {
                const numericValue = this.parseNumericValue(rawValue);
                if (numericValue === null) return;

                count++;
                sum += numericValue;
                min = Math.min(min, numericValue);
                max = Math.max(max, numericValue);
            },
        );

        return {
            count,
            min: count > 0 ? min : null,
            max: count > 0 ? max : null,
            sum,
            average: count > 0 ? sum / count : null,
        };
    }

    private parseNumericValue(value: string): number | null {
        const normalized = value.replace(/,/g, '').trim();
        if (normalized === '') return null;

        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : null;
    }
}
