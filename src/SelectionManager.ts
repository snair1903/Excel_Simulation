import type { Cell, SelectionRange } from "./models.js";

export class SelectionManager {
    public selectedCell: Cell | null = null;
    public selectionRange: SelectionRange | null = null;
    public isSelecting = false;

    public startSelection(cell: Cell): void {
        this.selectedCell = cell;
        this.isSelecting = true;
        this.selectionRange = {
            startColumn: cell.col,
            startRow: cell.row,
            endRow: cell.row,
            endColumn: cell.col,
        };
    }

    public updateSelection(activeCell: Cell): void {
        if (!this.selectionRange || !this.selectedCell) return;
        this.selectionRange.startRow = Math.min(activeCell.row, this.selectedCell.row);
        this.selectionRange.startColumn = Math.min(activeCell.col, this.selectedCell.col);
        this.selectionRange.endRow = Math.max(activeCell.row, this.selectedCell.row);
        this.selectionRange.endColumn = Math.max(activeCell.col, this.selectedCell.col);
    }

    public endSelection(): void {
        this.isSelecting = false;
    }

    /** True when the selection spans more than a single cell. */
    public hasRangeSelection(): boolean {
        const r = this.selectionRange;
        if (!r) return false;
        return r.startRow !== r.endRow || r.startColumn !== r.endColumn;
    }
}
