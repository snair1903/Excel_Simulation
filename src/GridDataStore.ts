import type { GridData } from "./models.js";

export class GridDataStore {
    constructor(private readonly gridData: GridData) {}

    public getValue(row: number, col: number): string {
        return this.gridData[row]?.[col] ?? '';
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
}
