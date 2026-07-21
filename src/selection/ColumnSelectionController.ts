import { maxCols, maxRows, HEADER_SELECTION_SENTINEL } from "../Constants/Constant.js";
import type { Cell } from "../models/Types.js";
import { SelectionManager } from "./SelectionManager.js";


export class ColumnSelectionController extends SelectionManager {

    
    public hitTest(cell:Cell){
        this.startSelection(cell);
        
        return this.mode == 'column'
    }

    public updateSelection(activeCell: Cell): void {
        if (!this.selectionRange || !this.selectedCell) return;


        if (this.mode === 'column') {
            this.selectionRange.startColumn = Math.min(this.selectedCell.col, activeCell.col);
            this.selectionRange.endColumn = Math.max(this.selectedCell.col, activeCell.col);
            return;
        }

    }

    
}
