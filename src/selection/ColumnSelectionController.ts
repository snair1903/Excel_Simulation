import { maxCols, maxRows, HEADER_SELECTION_SENTINEL } from "../Constants/Constant.js";
import type { Cell, GridResolution } from "../models/Types.js";
import { SelectionManager } from "./SelectionManager.js";


export class ColumnSelectionController {
constructor(private readonly selectionManager:SelectionManager){}
    
    public hitTest(cell:Cell,resolution:GridResolution,e:PointerEvent){
        this.selectionManager.startSelection(cell);
        
        return this.selectionManager.mode == 'column'
    }

    public updateSelection(activeCell: Cell): void {
        if (!this.selectionManager.selectionRange || !this.selectionManager.selectedCell) return;


        if (this.selectionManager.mode === 'column') {
            this.selectionManager.selectionRange.startColumn = Math.min(this.selectionManager.selectedCell.col, activeCell.col);
            this.selectionManager.selectionRange.endColumn = Math.max(this.selectionManager.selectedCell.col, activeCell.col);
            return;
        }

    }

    public handlePointerDown(e:PointerEvent){
        this.selectionManager.isSelecting = true;
        this.selectionManager.selectionRange = {
            startRow:  0 ,
            endRow:  maxRows - 1 ,
            startColumn: this.selectionManager.selectedCell!.col,
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
