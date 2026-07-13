import { GridGeometry } from "./GridGeometry.js";

export interface ResizeResult {
    type: 'col-resize' | 'row-resize';
    index: number;
    oldSize: number;
    newSize: number;
}


export class ResizeController {
    private resizingColumn: number | null = null;
    private resizingRow: number | null = null;

    private resizingStartX = 0;
    private resizeInitialWidth = 0;

    private resizingStartY = 0;
    private resizeInitialHeight = 0;

    private resizePending = false;
    private pendingMouseEvent: MouseEvent | null = null;

    constructor(private readonly geometry: GridGeometry) {}

    public isResizing(): boolean {
        return this.resizingColumn !== null || this.resizingRow !== null;
    }

    public tryStartFromGridPoint(gridX: number | null, gridY: number | null, clientX: number, clientY: number): boolean {
        let started = false;

        const col = gridX === null ? null : this.geometry.getResizeColumnBorder(gridX);
        if (col !== null) {
            this.resizingColumn = col;
            this.resizingStartX = clientX;
            this.resizeInitialWidth = this.geometry.widthArray[col]!;
            started = true;
        }

        const row = gridY === null ? null : this.geometry.getResizeRowBorder(gridY);
        if (row !== null) {
            this.resizingRow = row;
            this.resizingStartY = clientY;
            this.resizeInitialHeight = this.geometry.heightArray[row]!;
            started = true;
        }

        return started;
    }

    public queueDrag(e: MouseEvent, onFrame: () => void): void {
        this.pendingMouseEvent = e;
        if (!this.resizePending) {
            this.resizePending = true;
            requestAnimationFrame(onFrame);
        }
    }

    public hasPendingFrame(): boolean {
        return this.resizePending;
    }

    /** Applies the buffered mouse position to the geometry. Returns true if anything changed. */
    public processDrag(): boolean {
        this.resizePending = false;
        const e = this.pendingMouseEvent;
        if (!e) return false;

        let changed = false;

        if (this.resizingColumn !== null) {
            const deltaX = e.clientX - this.resizingStartX;
            this.geometry.setColumnWidth(this.resizingColumn, this.resizeInitialWidth + deltaX);
            changed = true;
        }

        if (this.resizingRow !== null) {
            const deltaY = e.clientY - this.resizingStartY;
            this.geometry.setRowHeight(this.resizingRow, this.resizeInitialHeight + deltaY);
            changed = true;
        }

        return changed;
    }

    /** Ends the drag and returns the resulting undo-able actions, if sizes actually changed. */
    public finalize(): ResizeResult[] {
        const results: ResizeResult[] = [];

        if (this.resizingColumn !== null) {
            const col = this.resizingColumn;
            const newWidth = this.geometry.widthArray[col]!;
            if (newWidth !== this.resizeInitialWidth) {
                results.push({ type: 'col-resize', index: col, oldSize: this.resizeInitialWidth, newSize: newWidth });
            }
            this.resizingColumn = null;
        }

        if (this.resizingRow !== null) {
            const row = this.resizingRow;
            const newHeight = this.geometry.heightArray[row]!;
            if (newHeight !== this.resizeInitialHeight) {
                results.push({ type: 'row-resize', index: row, oldSize: this.resizeInitialHeight, newSize: newHeight });
            }
            this.resizingRow = null;
        }

        return results;
    }

    public getHoverCursor(gridX: number, gridY: number, isNearTopStrip: boolean, isNearLeftStrip: boolean): 'col-resize' | 'row-resize' | 'default' {
        if (isNearTopStrip && this.geometry.getResizeColumnBorder(gridX) !== null) {
            return 'col-resize';
        }
        if (isNearLeftStrip && this.geometry.getResizeRowBorder(gridY) !== null) {
            return 'row-resize';
        }
        return 'default';
    }
}
