import { maxCols, maxRows, HEADER_SELECTION_SENTINEL } from "../Constants/Constant.js";
import type { Cell, SelectionRange } from "../models/Types.js";
import type { selectionMode } from "../models/Types.js";

export class SelectionManager {
    public selectedCell: Cell | null ;
    public selectionRange: SelectionRange | null ;
    public isSelecting = false;
    public mode: selectionMode ;
    constructor(cell:Cell|null,selectionR:SelectionRange|null,modes:selectionMode){
        this.selectedCell = cell;
    this.selectionRange = selectionR;
    this.mode= modes;
    }

    public startSelection(cell: Cell): void {
        
        this.selectedCell = cell;

        const isRowHeaderClick = cell.col === HEADER_SELECTION_SENTINEL;
        const isColumnHeaderClick = cell.row === HEADER_SELECTION_SENTINEL;

        this.mode = isRowHeaderClick && isColumnHeaderClick
            ? 'all'
            : isRowHeaderClick
                ? 'row'
                : isColumnHeaderClick
                    ? 'column'
                    : 'cell';

        
    }

    // public updateSelection(activeCell: Cell): void {
    //     if (!this.selectionRange || !this.selectedCell) return;

    //     if (this.mode === 'all') return; // whole-sheet selection doesn't grow/shrink on drag

    //     if (this.mode === 'row') {
    //         this.selectionRange.startRow = Math.min(this.selectedCell.row, activeCell.row);
    //         this.selectionRange.endRow = Math.max(this.selectedCell.row, activeCell.row);
    //         return;
    //     }

    //     if (this.mode === 'column') {
    //         this.selectionRange.startColumn = Math.min(this.selectedCell.col, activeCell.col);
    //         this.selectionRange.endColumn = Math.max(this.selectedCell.col, activeCell.col);
    //         return;
    //     }

    //     this.selectionRange.startRow = Math.min(activeCell.row, this.selectedCell.row);
    //     this.selectionRange.startColumn = Math.min(activeCell.col, this.selectedCell.col);
    //     this.selectionRange.endRow = Math.max(activeCell.row, this.selectedCell.row);
    //     this.selectionRange.endColumn = Math.max(activeCell.col, this.selectedCell.col);
    // }

    public endSelection(): void {
        this.isSelecting = false
    }

    public hasRangeSelection(): boolean {
        if (this.mode !== 'cell') return this.selectionRange !== null;
        const r = this.selectionRange;
        if (!r) return false;
        return r.startRow !== r.endRow || r.startColumn !== r.endColumn;
    }

    // public handlePointerDown(){
       
    //     const isRowHeaderClick = this.selectedCell?.col === HEADER_SELECTION_SENTINEL;
    //     const isColumnHeaderClick = this.selectedCell?.row === HEADER_SELECTION_SENTINEL;

    //     this.selectionRange = {
    //         startRow: isColumnHeaderClick ? 0 : this.selectedCell!.row,
    //         endRow: isColumnHeaderClick ? maxRows - 1 : this.selectedCell!.row,
    //         startColumn: isRowHeaderClick ? 0 : this.selectedCell!.col,
    //         endColumn: isRowHeaderClick ? maxCols - 1 : this.selectedCell!.col,
    //     };
    // }
    public getHoverCursor(gridX: number, gridY: number, isNearTopStrip: boolean, isNearLeftStrip: boolean): 'col-resize' | 'row-resize' | 'default' {
        
        return 'default';
    }
}
