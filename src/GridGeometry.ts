import { maxCols,colWidth,maxRows,rowHeight,minColWidth,minRowHeight,resizeBorderHitTolerancePx } from "./Constants/Constant.js";

export class GridGeometry {
    

    public readonly widthArray: number[];
    public readonly heightArray: number[];

    private readonly prefWidthArray: number[];
    private readonly prefHeightArray: number[];

    constructor() {
        this.widthArray = new Array(maxCols).fill(colWidth);
        this.heightArray = new Array(maxRows).fill(rowHeight);

        this.prefWidthArray = new Array(maxCols + 1);
        this.prefHeightArray = new Array(maxRows + 1);

        this.buildPrefixSums();
    }

    private buildPrefixSums(): void {
        this.prefWidthArray[0] = 0;
        for (let i = 0; i < maxCols; i++) {
            this.prefWidthArray[i + 1] = this.prefWidthArray[i]! + this.widthArray[i]!;
        }

        this.prefHeightArray[0] = 0;
        for (let i = 0; i < maxRows; i++) {
            this.prefHeightArray[i + 1] = this.prefHeightArray[i]! + this.heightArray[i]!;
        }
    }

    public regenerateWidthPrefixFrom(fromIndex: number): void {
        const start = Math.max(1, fromIndex);
        for (let i = start; i < maxCols; i++) {
            this.prefWidthArray[i] = this.prefWidthArray[i - 1]! + this.widthArray[i - 1]!;
        }
    }

    public regenerateHeightPrefixFrom(fromIndex: number): void {
        const start = Math.max(1, fromIndex);
        for (let i = start; i < maxRows; i++) {
            this.prefHeightArray[i] = this.prefHeightArray[i - 1]! + this.heightArray[i - 1]!;
        }
    }

    public getColumnStart(col: number): number {
        return this.prefWidthArray[col]!;
    }

    public getRowStart(row: number): number {
        return this.prefHeightArray[row]!;
    }

    public getTotalWidth(): number {
        return this.prefWidthArray[maxCols - 1]! + this.widthArray[maxCols - 1]!;
    }

    public getTotalHeight(): number {
        return this.prefHeightArray[maxRows - 1]! + this.heightArray[maxRows - 1]!;
    }

     public getColumnAtX(x: number): number {
        let left = 0;
        let right = maxCols - 1;
        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            const start = this.prefWidthArray[mid]!;
            const end = start + this.widthArray[mid]!;

            if (x < start) right = mid - 1;
            else if (x >= end) left = mid + 1;
            else return mid;
        }
        return Math.max(0, Math.min(maxCols - 1, left));
    }

    public getRowAtY(y: number): number {
        let left = 0;
        let right =maxRows - 1;
        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            const start = this.prefHeightArray[mid]!;
            const end = start + this.heightArray[mid]!;

            if (y < start) right = mid - 1;
            else if (y >= end) left = mid + 1;
            else return mid;
        }
        return Math.max(0, Math.min(maxRows - 1, left));
    }


    public getResizeColumnBorder(x: number): number | null {
        for (let i = 1; i <= maxCols; i++) {
            const border = this.prefWidthArray[i]!;
            if (Math.abs(x - border) <= resizeBorderHitTolerancePx) return i - 1;
            if (border > x + resizeBorderHitTolerancePx) break; 
        }
        return null;
    }

    public getResizeRowBorder(y: number): number | null {
        for (let i = 1; i <= maxRows; i++) {
            const border = this.prefHeightArray[i]!;
            if (Math.abs(y - border) <= resizeBorderHitTolerancePx) return i - 1;
            if (border > y + resizeBorderHitTolerancePx) break;
        }
        return null;
    }

    public setColumnWidth(col: number, width: number): void {
        this.widthArray[col] = Math.max(minColWidth, width);
        this.regenerateWidthPrefixFrom(col + 1);
    }

    public setRowHeight(row: number, height: number): void {
        this.heightArray[row] = Math.max(minRowHeight, height);
        this.regenerateHeightPrefixFrom(row + 1);
    }

    public static generateColumnLabel(index: number): string {
        let label = '';
        let temp = index;
        while (temp >= 0) {
            label = String.fromCharCode((temp % 26) + 65) + label;
            temp = Math.floor(temp / 26) - 1;
        }
        return label;
    }
}
