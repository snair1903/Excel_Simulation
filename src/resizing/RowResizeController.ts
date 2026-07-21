import type { ResizeResult } from "../models/Types.js";
import { ResizeController } from "./ResizeController.js";

export class RowResizeController extends ResizeController {


    public hitTest(nearTopStrip:number,nearLeftStrip:number,gridX:number,gridY:number,clientX:number,clientY:number):boolean{
        const startedResizeRow = this.tryStartFromGridPoint(
            nearTopStrip ? gridX : null,
            nearLeftStrip ? gridY : null,
            clientX,
            clientY,
        );
        return startedResizeRow

    }

    public tryStartFromGridPoint( gridX: number | null,gridY: number | null, clientx: number,clientY:number): boolean {
        let started = false;

        const row = gridY === null ? null : this.geometry.getResizeRowBorder(gridY);
        if (row !== null) {
            this.resizingRow = row;
            this.resizingStartY = clientY;
            this.resizeInitialHeight = this.geometry.rows.getSize(row);
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

       

        if (this.resizingRow !== null) {
            const deltaY = e.clientY - this.resizingStartY;
            this.geometry.rows.setSize(this.resizingRow, this.resizeInitialHeight + deltaY);
            changed = true;
        }

        return changed;
    }

    /** Ends the drag and returns the resulting undo-able results, if sizes actually changed. */
    public finalize(): ResizeResult[] {
        const results: ResizeResult[] = [];


        if (this.resizingRow !== null) {
            const row = this.resizingRow;
            const newHeight = this.geometry.rows.getSize(row);
            if (newHeight !== this.resizeInitialHeight) {
                results.push({ type: 'row-resize', index: row, oldSize: this.resizeInitialHeight, newSize: newHeight });
            }
            this.resizingRow = null;
        }

        return results;
    }

    // public getHoverCursor( gridY: number, isNearLeftStrip: boolean): 'row-resize' | 'default' {
    //     if (isNearLeftStrip && this.geometry.getResizeRowBorder(gridY) !== null) {
    //         return 'row-resize';
    //     }
    //     return 'default';
    // }
}
