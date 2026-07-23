import type { GridData } from "../models/Types.js";
import { CellModel } from "../models/CellModel.js";

export class GridDataStore {
    constructor(private readonly gridData: GridData) {}

    public getValue(row: number, col: number): string {
        return this.gridData[row]?.[col] ?? '';
    }

    public getCell(row: number, col: number): CellModel {
        return new CellModel(row, col, this.getValue(row, col));
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

    public loadData(newData: GridData): void {
        for (const key of Object.keys(this.gridData)) {
            delete this.gridData[Number(key)];
        }
        for (const [row, rowValues] of Object.entries(newData)) {
            this.gridData[Number(row)] = { ...rowValues };
        }
    }

    /**
     * Iterates only the populated cells that fall inside the given inclusive
     * range, without ever scanning the full 100,000 x 500 address space.
     * Consumers such as SummaryCalculator build their aggregates from this.
     */
    public forEachValueInRange(
        startRow: number,
        startCol: number,
        endRow: number,
        endCol: number,
        callback: (row: number, col: number, value: string) => void,
    ): void {
        for (const [rowKey, rowValues] of Object.entries(this.gridData)) {
            const row = Number(rowKey);
            if (row < startRow || row > endRow) continue;

            for (const [colKey, value] of Object.entries(rowValues) as Array<[string, string]>) {
                const col = Number(colKey);
                if (col < startCol || col > endCol) continue;

                callback(row, col, value);
            }
        }
    }
}
