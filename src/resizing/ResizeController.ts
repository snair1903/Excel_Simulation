import type { CommandManager } from "../commands/CommandManager.js";
import { GridGeometry } from "../geometry/GridGeometry.js";

export class ResizeController {
    protected resizingColumn: number | null = null;
    protected resizingRow: number | null = null;

    protected resizingStartX = 0;
    protected resizeInitialWidth = 0;

    protected resizingStartY = 0;
    protected resizeInitialHeight = 0;

    protected resizePending = false;
    protected pendingMouseEvent: MouseEvent | null = null;

    constructor(protected readonly geometry: GridGeometry,protected readonly scrollContent:HTMLDivElement,protected readonly commandManager:CommandManager) {}

    public isResizing(): boolean {
        return this.resizingColumn !== null || this.resizingRow !== null;
    }

    protected syncVirtualScrollDimensions(): void {
        this.scrollContent.style.width = `${this.geometry.getTotalWidth()}px`;
        this.scrollContent.style.height = `${this.geometry.getTotalHeight()}px`;
    }


    public tryStartFromGridPoint(gridX: number | null, gridY: number | null, clientX: number, clientY: number): boolean {
        let started = false;

        const col = gridX === null ? null : this.geometry.getResizeColumnBorder(gridX);
        if (col !== null) {
            this.resizingColumn = col;
            this.resizingStartX = clientX;
            this.resizeInitialWidth = this.geometry.columns.getSize(col);
            started = true;
        }

        const row = gridY === null ? null : this.geometry.getResizeRowBorder(gridY);
        if (row !== null) {
            this.resizingRow = row;
            this.resizingStartY = clientY;
            this.resizeInitialHeight = this.geometry.rows.getSize(row);
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
            this.geometry.columns.setSize(this.resizingColumn, this.resizeInitialWidth + deltaX);
            changed = true;
        }

        if (this.resizingRow !== null) {
            const deltaY = e.clientY - this.resizingStartY;
            this.geometry.rows.setSize(this.resizingRow, this.resizeInitialHeight + deltaY);
            changed = true;
        }

        return changed;
    }

    /** Ends the drag and returns the resulting undo-able results, if sizes actually changed. */
    // public finalize(): ResizeResult[] {
    //     const results: ResizeResult[] = [];

    //     if (this.resizingColumn !== null) {
    //         const col = this.resizingColumn;
    //         const newWidth = this.geometry.columns.getSize(col);
    //         if (newWidth !== this.resizeInitialWidth) {
    //             results.push({ type: 'col-resize', index: col, oldSize: this.resizeInitialWidth, newSize: newWidth });
    //         }
    //         this.resizingColumn = null;
    //     }

    //     if (this.resizingRow !== null) {
    //         const row = this.resizingRow;
    //         const newHeight = this.geometry.rows.getSize(row);
    //         if (newHeight !== this.resizeInitialHeight) {
    //             results.push({ type: 'row-resize', index: row, oldSize: this.resizeInitialHeight, newSize: newHeight });
    //         }
    //         this.resizingRow = null;
    //     }

    //     return results;
    // }

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
