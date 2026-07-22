import { ResizeController } from "./ResizeController.js";
import type { Cell, GridResolution, ResizeResult } from "../models/Types.js";
import { ResizeRowCommand } from "../commands/ResizeRowCommand.js";
import { CommandManager } from "../commands/CommandManager.js";
import { headerHeight, headerWidth } from "../Constants/Constant.js";

export class RowResizeController extends ResizeController {

    public tryStartFromGridPoint(gridY: number | null, clientY: number): boolean {
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

    public handlePointerDown(e: PointerEvent) {
    }

    public handlePointerMove(cell: Cell, e: PointerEvent) {
        this.queueDrag(e, () => {
            if (this.processDrag()) {
                this.syncVirtualScrollDimensions();
            }
        });
    }

    public handlePointerUp(cell: Cell, e: PointerEvent) {
        if (this.hasPendingFrame()) {
            this.processDrag();
        }
        for (const result of this.finalize()) {
            const command = new ResizeRowCommand(this.geometry.rows, result.index, result.oldSize, result.newSize);
            this.commandManager.registerExecuted(command);
        }
        this.syncVirtualScrollDimensions();
    }

    public hitTest(cell: Cell, resolution: GridResolution, e: PointerEvent): boolean {
        console.log("HIII");
        
        const isNearLeftStrip = resolution.screenX <= headerWidth; 

        const startedResizeRow = this.tryStartFromGridPoint(
            isNearLeftStrip ? resolution.gridY : null,
            e.clientY,
        );
        
        return startedResizeRow;
    }
}
