import type { Cell, GridResolution } from "../models/Types.js";
import { SelectionManager } from "./SelectionManager.js";

export class CellSelectionController {
    constructor(private readonly selectionManager:SelectionManager){}
    public hitTest(cell:Cell,resolution:GridResolution,e:PointerEvent){
        this.selectionManager.startSelection(cell);
        
        return this.selectionManager.mode == 'cell'
    }

    public updateSelection(activeCell: Cell): void {
        if (!this.selectionManager.selectionRange || !this.selectionManager.selectedCell) return;
        this.selectionManager.selectionRange.startRow = Math.min(activeCell.row, this.selectionManager.selectedCell.row);
        this.selectionManager.selectionRange.startColumn = Math.min(activeCell.col, this.selectionManager.selectedCell.col);
        this.selectionManager.selectionRange.endRow = Math.max(activeCell.row, this.selectionManager.selectedCell.row);
        this.selectionManager.selectionRange.endColumn = Math.max(activeCell.col, this.selectionManager.selectedCell.col);
    }

    public handlePointerDown(e:PointerEvent){
        this.selectionManager.isSelecting = true;
        this.selectionManager.selectionRange = {
            startRow:  this.selectionManager.selectedCell!.row,
            endRow:  this.selectionManager.selectedCell!.row,
            startColumn:  this.selectionManager.selectedCell!.col,
            endColumn: this.selectionManager.selectedCell!.col,
        };

        
    }

    public handlePointerMove(cell:Cell,e:PointerEvent){
        if(this.selectionManager.isSelecting)
            this.updateSelection(cell)
    }
   

    public handlePointerUp(cell:Cell,e:PointerEvent){
        this.updateSelection(cell)
        this.selectionManager.endSelection();
    }

    public getHoverCursor(gridX: number, gridY: number, isNearTopStrip: boolean, isNearLeftStrip: boolean): 'col-resize' | 'row-resize' | 'default' {
        
        return 'default';
    }
}
