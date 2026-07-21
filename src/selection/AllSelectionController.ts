import type { Cell } from "../models/Types.js";
import { SelectionManager } from "./SelectionManager.js";



export class AllSelectionController extends SelectionManager {
    
    public hitTest(cell:Cell){
        this.startSelection(cell);
        
        return this.mode == 'all'
    }

    public updateSelection(activeCell: Cell): void {
        if (!this.selectionRange || !this.selectedCell) return;

        if (this.mode === 'all') return; // whole-sheet selection doesn't grow/shrink on drag
    }

}
