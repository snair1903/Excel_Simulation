import { initialSparseData, type Cell, type GridData, type EditAction, type SelectionRange } from "./models.js";



class ExcelVirtualScroller {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    private scrollContainer: HTMLDivElement;
    private scrollContent: HTMLDivElement;
    private cellEditor: HTMLInputElement;

    private SelectionRange: SelectionRange | null = null;
    private isSelecting = false

    private isCommitting = false;

    private colWidth = 100;
    private rowHeight = 25;
    private headerWidth = 60;
    private headerHeight = 30;

    private minColWidth = 40;
    private minRowHeight = 16;

    private resizingColumn: number | null = null;
    private resizingStartX = 0;
    private resizeInitialWidth = 0;

    private resizingRow: number | null = null;
    private resizingStartY = 0;
    private resizeInitialHeight = 0;

    private resizePending = false;
    private pendingMouseEvent: MouseEvent | null = null;

    private maxRows = 100000;
    private maxCols = 500;

    private scrollX = 0;
    private scrollY = 0;

    private widthArray: number[];
    private heightArray: number[];

    private prefWidthArray: number[];
    private prefHeightArray: number[];

    private selectedCell: Cell | null = null;
    private editingCell: Cell | null = null;

    private gridData: GridData = initialSparseData;

    private undoStack: EditAction[] = [];
    private redoStack: EditAction[] = [];
    private readonly maxHistorySize = 200;

    constructor() {
        this.canvas = document.getElementById('excelCanvas') as HTMLCanvasElement;
        this.widthArray = new Array(this.maxCols).fill(this.colWidth);
        this.heightArray = new Array(this.maxRows).fill(this.rowHeight);

        this.prefWidthArray = new Array(this.maxCols + 1);
        this.prefHeightArray = new Array(this.maxRows + 1);

        this.ctx = this.canvas.getContext('2d')!;

        this.scrollContainer = document.getElementById('scroll-container') as HTMLDivElement;
        this.scrollContent = document.getElementById('scroll-content') as HTMLDivElement;
        this.cellEditor = document.getElementById('cell-editor') as HTMLInputElement;

        this.prefixGenerator();
        this.syncVirtualScrollDimensions();
        this.initCanvasScaling();
        this.setupScrollBinding();
        this.setupInteractionListeners();
    }

    private syncVirtualScrollDimensions(): void {
        const totalVirtualWidth = this.prefWidthArray[this.maxCols - 1]! + this.widthArray[this.maxCols - 1]!;
        const totalVirtualHeight = this.prefHeightArray[this.maxRows - 1]! + this.heightArray[this.maxRows - 1]!;
        this.scrollContent.style.width = `${totalVirtualWidth}px`;
        this.scrollContent.style.height = `${totalVirtualHeight}px`;
    }

    public initCanvasScaling(): void {
        const dpr = window.devicePixelRatio || 1;
        const w = window.innerWidth;
        const h = window.innerHeight;

        this.canvas.width = w * dpr;
        this.canvas.height = h * dpr;
        this.canvas.style.width = `${w}px`;
        this.canvas.style.height = `${h}px`;

        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(dpr, dpr);
        this.draw();
    }

    private setupScrollBinding(): void {
        this.scrollContainer.addEventListener('scroll', () => {
            this.scrollX = this.scrollContainer.scrollLeft;
            this.scrollY = this.scrollContainer.scrollTop;

            if (this.editingCell) {
                this.positionEditor(this.editingCell.row, this.editingCell.col);
            }

            this.draw();
        });
    }

    private prefixGenerator(): void {
        this.prefWidthArray[0] = 0;
        for (let i = 0; i < this.maxCols; i++) {
            this.prefWidthArray[i + 1] = this.prefWidthArray[i]! + this.widthArray[i]!;
        }

        this.prefHeightArray[0] = 0;
        for (let i = 0; i < this.maxRows; i++) {
            this.prefHeightArray[i + 1] = this.prefHeightArray[i]! + this.heightArray[i]!;
        }
    }

    private regenerateWidthPrefixFrom(fromIndex: number): void {
        const start = Math.max(1, fromIndex);
        for (let i = start; i < this.maxCols; i++) {
            this.prefWidthArray[i] = this.prefWidthArray[i - 1]! + this.widthArray[i - 1]!;
        }
    }

    private regenerateHeightPrefixFrom(fromIndex: number): void {
        const start = Math.max(1, fromIndex);
        for (let i = start; i < this.maxRows; i++) {
            this.prefHeightArray[i] = this.prefHeightArray[i - 1]! + this.heightArray[i - 1]!;
        }
    }

    private getColumnAtX(x: number): number {
        let left = 0;
        let right = this.maxCols - 1;
        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            const start = this.prefWidthArray[mid]!;
            const end = start + this.widthArray[mid]!;

            if (x < start) right = mid - 1;
            else if (x > end) left = mid + 1;
            else return mid;
        }
        return Math.max(0, Math.min(this.maxCols - 1, left));
    }

    private getRowAtY(y: number): number {
        let left = 0;
        let right = this.maxRows - 1;
        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            const start = this.prefHeightArray[mid]!;
            const end = start + this.heightArray[mid]!;

            if (y < start) right = mid - 1;
            else if (y > end) left = mid + 1;
            else return mid;
        }
        return Math.max(0, Math.min(this.maxRows - 1, left));
    }

    private setupInteractionListeners(): void {
        this.scrollContainer.addEventListener('mousedown', (e: MouseEvent) => {
            const rect = this.scrollContainer.getBoundingClientRect();
            const screenX = e.clientX - rect.left;
            const screenY = e.clientY - rect.top;
            if (this.editingCell && document.activeElement === this.cellEditor) {
                this.cellEditor.blur(); // This will trigger your blur listener naturally
            }
            // const gridX = screenX + this.scrollX - this.headerWidth;
            // const gridY = screenY + this.scrollY - this.headerHeight;
            if (screenY >= 0) {//<= this.headerHeight

                const resizeCol = this.getResizeColumn(screenX)! - 1;
                if (resizeCol !== null) {
                    this.resizingColumn = resizeCol;
                    this.resizingStartX = e.clientX;
                    this.resizeInitialWidth = this.widthArray[resizeCol]!;
                    e.preventDefault();
                    // return;
                }
            }

            if (screenX >= 0) {
                const resizeRow = this.getResizeRow(screenY)! - 1;
                if (resizeRow !== null) {
                    this.resizingRow = resizeRow;
                    this.resizingStartY = e.clientY;
                    this.resizeInitialHeight = this.heightArray[resizeRow]!;
                    e.preventDefault();
                    // return;
                }
            }

            if (this.editingCell) {
                this.commitCurrentEdit();
            }

            const cell = this.getCellCoordsFromMouseEvent(e);
            console.log(cell)
            if (cell) {
                console.log("hello")
                this.selectedCell = cell;
                this.isSelecting = true;
                // this.SelectionRange!.startColumn = cell.col
                // this.SelectionRange!.startRow = cell.row
                // this.SelectionRange!.endRow = cell.row
                // this.SelectionRange!.endColumn = cell.col
                this.SelectionRange = {
                    startColumn: cell.col,
                    startRow: cell.row,
                    endRow: cell.row,
                    endColumn: cell.col
                }
                console.log(this.SelectionRange)
                this.draw();
            }

        });

        document.addEventListener('mousemove', (e: MouseEvent) => {
            // 1. If actively selecting cells, process selection and exit
            if (this.isSelecting) {
                this.SelectionHandler(e);
                this.draw();
                return;
            }

            // 2. If actively dragging a resize bar, buffer the event and request a frame
            if (this.resizingColumn !== null || this.resizingRow !== null) {
                this.pendingMouseEvent = e;
                if (!this.resizePending) {
                    this.resizePending = true;
                    requestAnimationFrame(() => this.processResizeDrag());
                }
                return;
            }

            // 3. Only update hover cursors if the user is not actively dragging anything
            this.updateResizeCursor(e);
        });



        document.addEventListener('mouseup', (e: MouseEvent) => {
            // 1. Cleanly finalize cell selection
            if (this.isSelecting) {
                this.SelectionHandler(e);
                this.isSelecting = false; // Prevents sticky selection dragging
                this.draw();
                return;
            }

            // 2. Cleanly finalize column or row resizing
            if (this.resizingColumn !== null || this.resizingRow !== null) {
                // Force the final calculation immediately if the animation frame hasn't fired yet
                if (this.resizePending) {
                    this.processResizeDrag();
                }
                this.finalizeResize();
                this.draw();
            }
        });

        this.scrollContainer.addEventListener('dblclick', (e: MouseEvent) => {
            const cell = this.getCellCoordsFromMouseEvent(e);
            if (cell) {
                this.startEditingCell(cell.row, cell.col);
            }
            if (this.isSelecting) {
                this.isSelecting = false
                this.draw()
            }
        });

        this.cellEditor.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                this.commitCurrentEdit();
            } else if (e.key === 'Escape') {
                this.cancelCurrentEdit();
            }
        });

        this.cellEditor.addEventListener('blur', () => {
            console.log("blur");
            if (this.editingCell) {
                this.commitCurrentEdit();
                return;
            }
        });


        window.addEventListener('keydown', (e: KeyboardEvent) => {
            if (document.activeElement === this.cellEditor) return;

            const modifier = e.ctrlKey || e.metaKey;
            const key = e.key.toLowerCase();

            if (modifier && key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.undo();
                return;
            }
            if (modifier && (key === 'y' || (key === 'z' && e.shiftKey))) {
                e.preventDefault();
                this.redo();
                return;
            }
            if (!modifier && this.selectedCell && (e.key === 'Delete' || e.key === 'Backspace')) {
                const { row, col } = this.selectedCell;
                const oldValue = this.gridData[row]?.[col] || '';
                if (oldValue === '') return;
                this.pushAction({ type: 'cell-edit', row, col, oldValue, newValue: '' });
                this.setCellValueDirect(row, col, '');
                this.draw();
            }
        });
    }

    private SelectionHandler(e: MouseEvent): void {
        const activeCell = this.getCellCoordsFromMouseEvent(e);
        this.SelectionRange!.startRow = Math.min(activeCell!.row, this.selectedCell!.row);
        this.SelectionRange!.startColumn = Math.min(activeCell!.col, this.selectedCell!.col)
        this.SelectionRange!.endRow = Math.max(activeCell!.row, this.selectedCell!.row);
        this.SelectionRange!.endColumn = Math.max(activeCell!.col, this.selectedCell!.col)
    }


    private processResizeDrag(): void {
        this.resizePending = false;
        const e = this.pendingMouseEvent;
        if (!e) return;

        if (this.resizingColumn !== null) {
            const deltaX = e.clientX - this.resizingStartX;
            const col = this.resizingColumn;
            this.widthArray[col] = Math.max(this.minColWidth, this.resizeInitialWidth + deltaX);
            this.regenerateWidthPrefixFrom(col + 1);
            this.draw();
        }

        if (this.resizingRow !== null) {
            const deltaY = e.clientY - this.resizingStartY;
            const row = this.resizingRow;
            this.heightArray[row] = Math.max(this.minRowHeight, this.resizeInitialHeight + deltaY);
            this.regenerateHeightPrefixFrom(row + 1);
            this.draw();
        }
    }

    private finalizeResize(): void {
        if (this.resizingColumn !== null) {
            const col = this.resizingColumn;
            const newWidth = this.widthArray[col]!;
            if (newWidth !== this.resizeInitialWidth) {
                this.pushAction({ type: 'col-resize', col, oldWidth: this.resizeInitialWidth, newWidth });
            }
            this.resizingColumn = null;
            this.syncVirtualScrollDimensions();
        }

        if (this.resizingRow !== null) {
            const row = this.resizingRow;
            const newHeight = this.heightArray[row]!;
            if (newHeight !== this.resizeInitialHeight) {
                this.pushAction({ type: 'row-resize', row, oldHeight: this.resizeInitialHeight, newHeight });
            }
            this.resizingRow = null;
            this.syncVirtualScrollDimensions();
        }
    }

    private updateResizeCursor(e: MouseEvent): void {
        const rect = this.scrollContainer.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const gridX = screenX + this.scrollX - this.headerWidth;
        const gridY = screenY + this.scrollY - this.headerHeight;

        if (screenY <= this.headerHeight && this.getResizeColumn(gridX) !== null) {
            this.scrollContainer.style.cursor = 'col-resize';
        } else if (screenX <= this.headerWidth && this.getResizeRow(gridY) !== null) {
            this.scrollContainer.style.cursor = 'row-resize';
        } else {
            this.scrollContainer.style.cursor = 'default';
        }
    }

    private getResizeColumn(x: number): number | null {

        for (let i = 0; i < this.prefWidthArray.length; i++) {
            const border = this.prefWidthArray[i]! //+ this.widthArray[i]!;
            if (Math.abs(x - border) <= 5) return i;
        }
        return null;
    }

    private getResizeRow(y: number): number | null {
        for (let i = 0; i < this.prefHeightArray.length; i++) {
            const border = this.prefHeightArray[i]!// + this.heightArray[i]!;
            if (Math.abs(y - border) <= 5) return i;
        }
        return null;
    }

    private getCellCoordsFromMouseEvent(e: MouseEvent): Cell | null {
        const rect = this.scrollContainer.getBoundingClientRect();

        const gridX = (e.clientX - rect.left) + this.scrollX
        const gridY = (e.clientY - rect.top) + this.scrollY

        if (gridX < 0 || gridY < 0) return null; // click landed on a header

        const col = this.getColumnAtX(gridX);
        const row = this.getRowAtY(gridY);

        if (col >= 0 && col < this.maxCols && row >= 0 && row < this.maxRows) {
            return { row, col };
        }
        return null;
    }

    private startEditingCell(row: number, col: number): void {
        this.editingCell = { row, col };
        this.selectedCell = { row, col };

        const currentValue = this.gridData[row]?.[col] || '';
        this.cellEditor.value = currentValue;

        this.positionEditor(row, col);

        this.cellEditor.style.display = 'block';
        this.cellEditor.focus();
        this.cellEditor.select();
    }

    private positionEditor(row: number, col: number): void {
        const viewX = this.prefWidthArray[col]! - this.scrollX + this.headerWidth;
        const viewY = this.prefHeightArray[row]! - this.scrollY + this.headerHeight;

        this.cellEditor.style.left = `${viewX - 1}px`;
        this.cellEditor.style.top = `${viewY - 1}px`;

        this.cellEditor.style.width = `${this.widthArray[col]! + 2}px`;
        this.cellEditor.style.height = `${this.heightArray[row]! + 2}px`;
    }

    private commitCurrentEdit(): void {
        if (!this.editingCell || this.isCommitting) return;
        this.isCommitting = true
        const { row, col } = this.editingCell;
        const newValue = this.cellEditor.value.trim();
        const oldValue = this.gridData[row]?.[col] || '';

        if (newValue !== oldValue) {
            this.pushAction({ type: 'cell-edit', row, col, oldValue, newValue });
            this.setCellValueDirect(row, col, newValue);
        }

        this.closeEditor();
        this.isCommitting = false
    }
    // value remove from map if empty
    private setCellValueDirect(row: number, col: number, value: string): void {
        if (!this.gridData[row]) {
            this.gridData[row] = {};
        }
        if (value === '') {
            delete this.gridData[row][col];
        } else {
            this.gridData[row][col] = value;
        }
    }

    private cancelCurrentEdit(): void {
        this.closeEditor();
    }

    private closeEditor(): void {
        this.editingCell = null;
        this.cellEditor.style.display = 'none';
        this.scrollContainer.focus();
        this.draw();
    }


    private pushAction(action: EditAction): void {
        this.undoStack.push(action);
        if (this.undoStack.length > this.maxHistorySize) {
            this.undoStack.shift();
        }
        this.redoStack = []; // any new action invalidates the redo branch
    }

    public undo(): void {
        const action = this.undoStack.pop();
        if (!action) return;
        this.applyAction(action, true);
        this.redoStack.push(action);
    }

    public redo(): void {
        const action = this.redoStack.pop();
        if (!action) return;
        this.applyAction(action, false);
        this.undoStack.push(action);
    }

    private applyAction(action: EditAction, isUndo: boolean): void {
        switch (action.type) {
            case 'cell-edit': {
                const value = isUndo ? action.oldValue : action.newValue;
                this.setCellValueDirect(action.row, action.col, value);
                break;
            }
            case 'col-resize': {
                const width = isUndo ? action.oldWidth : action.newWidth;
                this.widthArray[action.col] = width;
                this.regenerateWidthPrefixFrom(action.col + 1);
                this.syncVirtualScrollDimensions();
                break;
            }
            case 'row-resize': {
                const height = isUndo ? action.oldHeight : action.newHeight;
                this.heightArray[action.row] = height;
                this.regenerateHeightPrefixFrom(action.row + 1);
                this.syncVirtualScrollDimensions();
                break;
            }
        }
        this.draw();
    }


    public draw(): void {
        const viewWidth = window.innerWidth;
        const viewHeight = window.innerHeight;

        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, viewWidth, viewHeight);

        this.drawVirtualCells(viewWidth, viewHeight);
        this.drawVirtualHeaders(viewWidth, viewHeight);
        this.drawSelectionHighlight();
    }

    private drawVirtualCells(viewWidth: number, viewHeight: number): void {
        this.ctx.font = '13px sans-serif';
        this.ctx.lineWidth = 1;

        const startCol = this.getColumnAtX(this.scrollX);
        const endCol = Math.min(this.maxCols - 1, this.getColumnAtX(this.scrollX + viewWidth - this.headerWidth));

        const startRow = this.getRowAtY(this.scrollY);
        const endRow = Math.min(this.maxRows - 1, this.getRowAtY(this.scrollY + viewHeight - this.headerHeight));

        for (let r = startRow; r <= endRow; r++) {
            const cellTopY = this.prefHeightArray[r]! - this.scrollY + this.headerHeight;

            for (let c = startCol; c <= endCol; c++) {
                const cellLeftX = this.prefWidthArray[c]! - this.scrollX + this.headerWidth;

                this.ctx.strokeStyle = '#e0e0e0';
                this.ctx.strokeRect(cellLeftX, cellTopY, this.widthArray[c]!, this.heightArray[r]!);

                const textVal = this.gridData[r]?.[c];
                const isBeingEdited = this.editingCell && this.editingCell.row === r && this.editingCell.col === c;

                if (textVal && !isBeingEdited) {
                    this.ctx.fillStyle = '#1c1c1c';
                    this.ctx.textAlign = 'left';
                    this.ctx.fillText(textVal, cellLeftX + 6, cellTopY + 17, this.widthArray[c]! - 12);
                }
            }
        }
    }

    private drawSelectionHighlight(): void {
        if (!this.selectedCell || this.editingCell) return;

        const { row, col } = this.selectedCell;
        const x = this.prefWidthArray[col]! - this.scrollX + this.headerWidth;
        const y = this.prefHeightArray[row]! - this.scrollY + this.headerHeight;

        if (x + this.widthArray[col]! < this.headerWidth || y + this.heightArray[row]! < this.headerHeight) return;

        this.ctx.strokeStyle = '#107c41';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, this.widthArray[col]!, this.heightArray[row]!);

        // console.log("hii")
        this.ctx.strokeStyle = '#107c41'
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.SelectionRange!.startRow, this.SelectionRange!.startColumn, this.SelectionRange!.endRow - this.SelectionRange!.startColumn, this.SelectionRange!.endColumn - this.SelectionRange!.startColumn);
        this.ctx.fillStyle = "rgba(33,115,70,0.1)"
        this.ctx.fillRect(this.SelectionRange!.startRow, this.SelectionRange!.startColumn, this.SelectionRange!.endRow - this.SelectionRange!.startColumn, this.SelectionRange!.endColumn - this.SelectionRange!.startColumn);


    }

    private drawVirtualHeaders(viewWidth: number, viewHeight: number): void {
        this.ctx.font = '500 11px sans-serif';
        this.ctx.textAlign = 'center';

        const startCol = this.getColumnAtX(this.scrollX);
        const endCol = Math.min(this.maxCols - 1, this.getColumnAtX(this.scrollX + viewWidth - this.headerWidth));

        const startRow = this.getRowAtY(this.scrollY);
        const endRow = Math.min(this.maxRows - 1, this.getRowAtY(this.scrollY + viewHeight - this.headerHeight));

        for (let c = startCol; c <= endCol; c++) {
            const x = this.prefWidthArray[c]! - this.scrollX + this.headerWidth;
            this.ctx.fillStyle = '#f8f9fa';
            this.ctx.fillRect(x, 0, this.widthArray[c]!, this.headerHeight);
            this.ctx.strokeStyle = '#c0c0c0';
            this.ctx.strokeRect(x, 0, this.widthArray[c]!, this.headerHeight);

            this.ctx.fillStyle = '#444444';
            this.ctx.fillText(this.generateColumnLabel(c), x + (this.widthArray[c]! / 2), 19);
        }

        for (let r = startRow; r <= endRow; r++) {
            const y = this.prefHeightArray[r]! - this.scrollY + this.headerHeight;
            this.ctx.fillStyle = '#f8f9fa';
            this.ctx.fillRect(0, y, this.headerWidth, this.heightArray[r]!);
            this.ctx.strokeStyle = '#c0c0c0';
            this.ctx.strokeRect(0, y, this.headerWidth, this.heightArray[r]!);
            this.ctx.fillStyle = '#444444';
            this.ctx.fillText((r + 1).toString(), this.headerWidth / 2, y + 16);
        }

        this.ctx.fillStyle = '#e8eaed';
        this.ctx.fillRect(0, 0, this.headerWidth, this.headerHeight);
        this.ctx.strokeStyle = '#c0c0c0';
        this.ctx.strokeRect(0, 0, this.headerWidth, this.headerHeight);
    }

    private generateColumnLabel(index: number): string {
        let label = '';
        let temp = index;
        while (temp >= 0) {
            label = String.fromCharCode((temp % 26) + 65) + label;
            temp = Math.floor(temp / 26) - 1;
        }
        return label;
    }
}

window.addEventListener('load', () => {
    const grid = new ExcelVirtualScroller();
    window.addEventListener('resize', () => grid.initCanvasScaling());
});