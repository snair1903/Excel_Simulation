import type { Cell, GridResolution } from "../models/Types.js";
import { SelectionManager } from "./SelectionManager.js";

import { maxCols,maxRows } from "../Constants/Constant.js";

export class AllSelectionController{
    constructor(private readonly selectionManager:SelectionManager){}
    
    public hitTest(cell:Cell,grid:GridResolution,e:PointerEvent){
        this.selectionManager.startSelection(cell);
        
        return this.selectionManager.mode == 'all'
    }

    public updateSelection(activeCell: Cell): void {
        if (!this.selectionManager.selectionRange || !this.selectionManager.selectedCell) return;

        if (this.selectionManager.mode === 'all') return; // whole-sheet selection doesn't grow/shrink on drag
    }

    public handlePointerDown(e:PointerEvent){
        this.selectionManager.isSelecting = true;
        this.selectionManager.selectionRange = {
            startRow:  0 ,
            endRow:  maxRows - 1 ,
            startColumn: 0,
            endColumn: maxCols - 1,
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
