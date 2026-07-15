import { headerHeight, headerWidth } from "../Constants/Constant.js";
import { GridGeometry } from "../geometry/GridGeometry.js";

/** Inclusive row/column bounds of what should currently be drawn/hit-tested. */
export interface VisibleRange {
    startRow: number;
    endRow: number;
    startCol: number;
    endCol: number;
}

/**
 * Computes the visible row/column window for the current scroll position and
 * viewport size. This is the core of virtual rendering: GridRenderer only
 * ever draws this range, never the full 100,000 x 500 grid, and it is
 * computed once per frame and shared by both the cell pass and the header
 * pass (the previous implementation computed the same range twice, once in
 * each drawing method).
 */
export class ViewportManager {
    constructor(private readonly geometry: GridGeometry) {}

    public getVisibleRange(viewWidth: number, viewHeight: number, scrollX: number, scrollY: number): VisibleRange {
        const startCol = this.geometry.getColumnAtX(scrollX);
        const endCol = Math.min(
            this.geometry.columns.getCount() - 1,
            this.geometry.getColumnAtX(scrollX + viewWidth - headerWidth),
        );

        const startRow = this.geometry.getRowAtY(scrollY);
        const endRow = Math.min(
            this.geometry.rows.getCount() - 1,
            this.geometry.getRowAtY(scrollY + viewHeight - headerHeight),
        );

        return { startRow, endRow, startCol, endCol };
    }
}
