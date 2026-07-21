import { GridGeometry } from "../geometry/GridGeometry.js";
import type { ResizeResult } from "../models/Types.js";
import { ResizeController } from "./ResizeController.js";

export class ColumnResizeController extends ResizeController {


    public tryStartFromGridPoint(gridX: number | null,  clientX: number): boolean {
        let started = false;

        const col = gridX === null ? null : this.geometry.getResizeColumnBorder(gridX);
        if (col !== null) {
            this.resizingColumn = col;
            this.resizingStartX = clientX;
            this.resizeInitialWidth = this.geometry.columns.getSize(col);
            started = true;
        }

        return started;
    }

    // public queueDrag(e: MouseEvent, onFrame: () => void): void {
    //     this.pendingMouseEvent = e;
    //     if (!this.resizePending) {
    //         this.resizePending = true;
    //         requestAnimationFrame(onFrame);
    //     }
    // }

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

        return changed;
    }

    /** Ends the drag and returns the resulting undo-able results, if sizes actually changed. */
    public finalize(): ResizeResult[] {
        const results: ResizeResult[] = [];

        if (this.resizingColumn !== null) {
            const col = this.resizingColumn;
            const newWidth = this.geometry.columns.getSize(col);
            if (newWidth !== this.resizeInitialWidth) {
                results.push({ type: 'col-resize', index: col, oldSize: this.resizeInitialWidth, newSize: newWidth });
            }
            this.resizingColumn = null;
        }


        return results;
    }

    // public getHoverCursor(gridX: number, gridY: number, isNearTopStrip: boolean, isNearLeftStrip: boolean): 'col-resize' | 'default' {
    //     if (isNearTopStrip && this.geometry.getResizeColumnBorder(gridX) !== null) {
    //         return 'col-resize';
    //     }
    //     return 'default';
    // }
}
