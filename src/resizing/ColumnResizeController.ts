import { GridGeometry } from "../geometry/GridGeometry.js";
import type { Cell, GridResolution, ResizeResult } from "../models/Types.js";
import { ResizeController } from "./ResizeController.js";
import { ResizeColumnCommand } from "../commands/ResizeColumnCommand.js";
import { CommandManager } from "../commands/CommandManager.js";
import { headerHeight, headerWidth } from "../Constants/Constant.js";

export class ColumnResizeController extends ResizeController {

    public tryStartFromGridPoint(gridX: number | null, clientX: number): boolean {
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

    public hasPendingFrame(): boolean {
        return this.resizePending;
    }

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

    public handlePointerDown(e: PointerEvent) {
        e.preventDefault();
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
            const command = new ResizeColumnCommand(this.geometry.columns, result.index, result.oldSize, result.newSize);
            this.commandManager.registerExecuted(command);
        }
        this.syncVirtualScrollDimensions();
    }

    public hitTest(cell: Cell, resolution: GridResolution, e: PointerEvent): boolean {
        const nearTopStrip = resolution.screenY <= headerHeight;
        
        const startedResizeCol = this.tryStartFromGridPoint(
            nearTopStrip ? resolution.gridX : null,
            e.clientX,
        );
        return startedResizeCol;
    }
}
