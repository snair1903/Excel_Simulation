import { maxCols, maxRows, colWidth, rowHeight, minColWidth, minRowHeight, resizeBorderHitTolerancePx } from "../Constants/Constant.js";
import { ColumnModel } from "./ColumnModel.js";
import { RowModel } from "./RowModel.js";

export class GridGeometry {
    public readonly columns: ColumnModel;
    public readonly rows: RowModel;

    constructor() {
        this.columns = new ColumnModel(maxCols, colWidth, minColWidth);
        this.rows = new RowModel(maxRows, rowHeight, minRowHeight);
    }

    public getColumnAtX(x: number): number {
        return this.columns.getIndexAtOffset(x);
    }

    public getRowAtY(y: number): number {
        return this.rows.getIndexAtOffset(y);
    }

    public getResizeColumnBorder(x: number): number | null {
        return this.columns.getResizeBorderAtOffset(x, resizeBorderHitTolerancePx);
    }

    public getResizeRowBorder(y: number): number | null {
        return this.rows.getResizeBorderAtOffset(y, resizeBorderHitTolerancePx);
    }

    public getTotalWidth(): number {
        return this.columns.getTotalSize();
    }

    public getTotalHeight(): number {
        return this.rows.getTotalSize();
    }
}
