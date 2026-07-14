import type { GridData, RangeSummary } from "./models.js";

export class GridDataStore {
    constructor(private readonly gridData: GridData) {}

    public getValue(row: number, col: number): string {
        return this.gridData[row]?.[col] ?? '';
    }

    public loadData(newData: GridData): void {
        for (const key of Object.keys(this.gridData)) {
            delete this.gridData[Number(key)];
        }
        for (const [row, rowValues] of Object.entries(newData)) {
            this.gridData[Number(row)] = { ...rowValues };
        }
    }

    public setValue(row: number, col: number, value: string): void {
        if (!this.gridData[row]) {
            this.gridData[row] = {};
        }
        if (value === '') {
            delete this.gridData[row][col];
        } else {
            this.gridData[row][col] = value;
        }
    }

    public getNumericSummary(startRow: number, startCol: number, endRow: number, endCol: number): RangeSummary {
        let count = 0;
        let sum = 0;
        let min = Number.POSITIVE_INFINITY;
        let max = Number.NEGATIVE_INFINITY;

        for (const [rowKey, rowValues] of Object.entries(this.gridData)) {
            const row = Number(rowKey);
            if (row < startRow || row > endRow) continue;

            for (const [colKey, rawValue] of Object.entries(rowValues) as Array<[string, string]>) {
                const col = Number(colKey);
                if (col < startCol || col > endCol) continue;

                const numericValue = this.parseNumericValue(rawValue);
                if (numericValue === null) continue;

                count++;
                sum += numericValue;
                min = Math.min(min, numericValue);
                max = Math.max(max, numericValue);
            }
        }

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
