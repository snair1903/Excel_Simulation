import { maxCols, maxRows, HEADER_SELECTION_SENTINEL } from "../Constants/Constant.js";
import type { Cell, GridResolution, SelectionRange } from "../models/Types.js";
import { SelectionManager } from "./SelectionManager.js";
export class RowSelectionController {
    constructor(private readonly selectionManager:SelectionManager){}

    public hitTest(cell:Cell,resolution:GridResolution,e:PointerEvent){
        this.selectionManager.startSelection(cell);
        
        return this.selectionManager.mode == 'row'
    }



    public updateSelection(activeCell: Cell): void {
        console.log("")
        if (!this.selectionManager.selectionRange || !this.selectionManager.selectedCell) return;


        if (this.selectionManager.mode === 'row') {
            this.selectionManager.selectionRange.startRow = Math.min(this.selectionManager.selectedCell.row, activeCell.row);
            this.selectionManager.selectionRange.endRow = Math.max(this.selectionManager.selectedCell.row, activeCell.row);
            return;
        }
    }

    public handlePointerDown(e:PointerEvent){
        this.selectionManager.isSelecting = true;
        this.selectionManager.selectionRange = {
            startRow: this.selectionManager.selectedCell!.row,
            endRow:  this.selectionManager.selectedCell!.row,
            startColumn:  0 ,
            endColumn: maxCols - 1 
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
