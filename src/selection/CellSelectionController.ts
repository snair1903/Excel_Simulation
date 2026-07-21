import type { Cell } from "../models/Types.js";
import { SelectionManager } from "./SelectionManager.js";

export class CellSelectionController extends SelectionManager{
    public hitTest(cell:Cell){
        this.startSelection(cell);
        
        return this.mode == 'cell'
    }

    public updateSelection(activeCell: Cell): void {
        if (!this.selectionRange || !this.selectedCell) return;
        this.selectionRange.startRow = Math.min(activeCell.row, this.selectedCell.row);
        this.selectionRange.startColumn = Math.min(activeCell.col, this.selectedCell.col);
        this.selectionRange.endRow = Math.max(activeCell.row, this.selectedCell.row);
        this.selectionRange.endColumn = Math.max(activeCell.col, this.selectedCell.col);
    }

   
}
