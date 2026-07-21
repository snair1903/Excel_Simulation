import { maxCols, maxRows, HEADER_SELECTION_SENTINEL } from "../Constants/Constant.js";
import type { Cell, SelectionRange } from "../models/Types.js";
import { SelectionManager } from "./SelectionManager.js";

export class RowSelectionController extends SelectionManager {

    public hitTest(cell:Cell){
        this.startSelection(cell);
        
        return this.mode == 'row'
    }


    public updateSelection(activeCell: Cell): void {
        if (!this.selectionRange || !this.selectedCell) return;


        if (this.mode === 'row') {
            this.selectionRange.startRow = Math.min(this.selectedCell.row, activeCell.row);
            this.selectionRange.endRow = Math.max(this.selectedCell.row, activeCell.row);
            return;
        }
    }

}
