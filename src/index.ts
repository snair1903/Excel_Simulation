import { initialSparseData, type Cell, type GridData } from "./models.js";

class ExcelVirtualScroller {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    private scrollContainer: HTMLDivElement;
    private scrollContent: HTMLDivElement;
    private cellEditor: HTMLInputElement; // Floating edit box link

    private colWidth = 100;

    private resizingColumn: number | null = null;
    private resizingStartx = 0;
    private resizeInitialWidth = 0;

    private resizingRow: number | null = null;
    private resizingStarty = 0;
    private resizeInitialHeight = 0;


    private rowHeight = 25;
    private headerWidth = 60;
    private headerHeight = 30;

    private maxRows = 100000;
    private maxCols = 500;

    private scrollX = 0;
    private scrollY = 0;

    // arrays for width and height
    private widthArray: number[];
    private heightArray: number[];

    //Prefixs
    private prefWidthArray: number[];
    private prefHeightArray: number[];


    // Tracker System Matrix Positions
    private selectedCell: Cell | null = null;
    private editingCell: Cell | null = null;

    private gridData: GridData = initialSparseData;

    constructor() {
        this.canvas = document.getElementById('excelCanvas') as HTMLCanvasElement;
        this.widthArray = new Array(this.maxCols).fill(this.colWidth)
        this.heightArray = new Array(this.maxRows).fill(this.rowHeight)

        this.prefWidthArray = new Array(this.maxCols)
        this.prefHeightArray = new Array(this.maxRows)

        this.ctx = this.canvas.getContext('2d')!;
        console.log(this.canvas)

        this.scrollContainer = document.getElementById('scroll-container') as HTMLDivElement;
        this.scrollContent = document.getElementById('scroll-content') as HTMLDivElement;
        this.cellEditor = document.getElementById('cell-editor') as HTMLInputElement;

        this.syncVirtualScrollDimensions();
        this.initCanvasScaling();
        this.setupScrollBinding();
        this.prefixGenerator();
        this.setupInteractionListeners();
    }

    private syncVirtualScrollDimensions(): void {
        const totalVirtualWidth = this.maxCols * this.colWidth;
        const totalVirtualHeight = this.maxRows * this.rowHeight;
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

        this.ctx.scale(dpr, dpr);
        this.draw();
    }

    private setupScrollBinding(): void {
        this.scrollContainer.addEventListener('scroll', () => {
            this.scrollX = this.scrollContainer.scrollLeft;
            this.scrollY = this.scrollContainer.scrollTop;

            // Move editor box dynamically while scrolling if cell is actively being edited
            if (this.editingCell) {
                this.positionEditor(this.editingCell.row, this.editingCell.col);
            }

            this.draw();
        });
    }

    private prefixGenerator(): void {
        this.prefWidthArray[0] = 0;

        for (let i = 1; i < this.maxCols; i++) {
            this.prefWidthArray[i] =
                this.prefWidthArray[i - 1]! + this.widthArray[i - 1]!;
        }

        this.prefHeightArray[0] = 0;

        for (let i = 1; i < this.maxRows; i++) {
            this.prefHeightArray[i] =
                this.prefHeightArray[i - 1]! + this.heightArray[i - 1]!;
        }


    }

    private getColumnAtX(x: number): number {
        let left = 0;
        let right = this.maxCols - 1;
        while (left <= right) {
            const mid = Math.floor((left + right) / 2)

            const start = this.prefWidthArray[mid]!;
            const end = start + this.widthArray[mid]!;

            if (x < start) {
                right = mid - 1
            }
            else if (x > end) {
                left = mid + 1;
            }
            else return mid;
        }
        return 0;
    }


    private getColumnAtY(Y: number): number {
        let left = 0;
        let right = this.maxRows - 1;
        while (left <= right) {
            const mid = Math.floor((left + right) / 2)

            const start = this.prefHeightArray[mid]!;
            const end = start + this.heightArray[mid]!;

            if (Y < start) {
                right = mid - 1
            }
            else if (Y > end) {
                left = mid + 1;
            }
            else return mid;
        }
        return 0;
    }





    private setupInteractionListeners(): void {
        // Handle Cell Selecting via Single-Click
        this.scrollContainer.addEventListener('mousedown', (e: MouseEvent) => {
            // Commit any open changes if user clicks away to select a different target cell
            // if (this.editingCell) {
            //     this.commitCurrentEdit();
            // }

            // const cell = this.getCellCoordsFromMouseEvent(e);
            // if (cell) {
            //     this.selectedCell = cell;
            //     this.draw();
            // }

            const rect = this.scrollContainer.getBoundingClientRect();
            const x = (e.clientX - rect.left) + this.scrollX - this.headerWidth
            const Y = (e.clientY - rect.top) + this.scrollY - this.headerHeight
            if (Y <= this.headerHeight) {
                const resizeCol = this.getResizeColumn(x);

                if (resizeCol !== null) {
                    this.resizingColumn = resizeCol
                    this.resizingStartx = e.clientX;
                    this.resizeInitialWidth = this.widthArray[resizeCol]!;

                }
            }
            if (x <= this.headerWidth) {
                const resizeRow = this.getResizeColumn(Y);
                if (resizeRow !== null) {
                    this.resizingRow = resizeRow
                    this.resizingStarty = e.clientY;
                    this.resizeInitialHeight = this.widthArray[resizeRow]!;
                }
            }
            if (this.editingCell) {
                this.commitCurrentEdit();
            }
            const cell = this.getCellCoordsFromMouseEvent(e);

            if (cell) {
                this.selectedCell = cell;
                this.draw;
            }


        });

        this.scrollContainer.addEventListener("mouseover", (e) => {
            if (this.resizingColumn !== null) {

                const deltax = e.clientX - this.resizingStartx;
                this.widthArray[this.resizingColumn!] = Math.max(40, this.resizeInitialWidth + deltax);
                this.prefixGenerator();
                this.draw();
            }
            if (this.resizingRow !== null) {
                const deltaY = e.clientY - this.resizingStarty;
                this.heightArray[this.resizingRow!] = Math.max(100, this.resizeInitialHeight + deltaY)
                this.prefixGenerator();
                this.draw();
            }
        });

        this.scrollContainer.addEventListener("mouseup", (e) => {
            this.resizingColumn = null;
            this.resizingRow = null;
        })

        // Trigger Inline Editing via Double-Click
        this.scrollContainer.addEventListener('dblclick', (e: MouseEvent) => {
            const cell = this.getCellCoordsFromMouseEvent(e);
            if (cell) {
                this.startEditingCell(cell.row, cell.col);
            }
        });

        // Input Keyboard Listeners: Save on 'Enter' key, dismiss on 'Escape' key
        this.cellEditor.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                this.commitCurrentEdit();
            } else if (e.key === 'Escape') {
                this.cancelCurrentEdit();
            }
        });

        // Commit cell edits if the input element loses focus
        this.cellEditor.addEventListener('blur', () => {
            if (this.editingCell) {
                this.commitCurrentEdit();
            }
        });
    }

    private getResizeColumn(x: number): number | null {
        for (let i = 0; i < this.maxCols; i++) {
            const border = this.prefWidthArray[i]! + this.widthArray[i]!;

            if (Math.abs(x - border) <= 5) {
                return i;
            }
        }
        return null;
    }

    private getResizeRow(y: number): number | null {
        for (let i = 0; i < this.maxCols; i++) {
            const border = this.prefHeightArray[i]! + this.heightArray[i]!;

            if (Math.abs(y - border) <= 5) {
                return i;
            }
        }
        return null;
    }

    private getCellCoordsFromMouseEvent(e: MouseEvent): Cell | null {
        const rect = this.scrollContainer.getBoundingClientRect();

        // Calculate absolute grid pixels by combining click offset positioning parameters with current viewport offsets
        const absoluteGridX = (e.clientX - rect.left) + this.scrollX;
        const absoluteGridY = (e.clientY - rect.top) + this.scrollY;

        const col = this.getColumnAtX(absoluteGridX);
        const row = this.getColumnAtY(absoluteGridY);

        // Grid boundaries safety check
        if (col >= 0 && col < this.maxCols && row >= 0 && row < this.maxRows) {
            return { row, col };
        }
        return null;
    }

    private startEditingCell(row: number, col: number): void {
        this.editingCell = { row, col };
        this.selectedCell = { row, col };

        // Read string state value out from program data storage matrix fallback references
        const currentValue = this.gridData[row]?.[col] || '';
        this.cellEditor.value = currentValue;

        this.positionEditor(row, col);

        this.cellEditor.style.display = 'block';
        this.cellEditor.focus();
        this.cellEditor.select(); // Highlight initial text instantly for standard user experience
    }

    private positionEditor(row: number, col: number): void {
        // Translate index spots back into coordinate view space pixels
        const viewX = this.prefWidthArray[col]! - this.scrollX;
        const viewY = this.prefHeightArray[row]! - this.scrollY;

        // Shift positions left and up by 1px to cleanly align the border 
        // over the original 1px gray grid lines
        this.cellEditor.style.left = `${viewX - 1}px`;
        this.cellEditor.style.top = `${viewY - 1}px`;

        // Expand sizing parameters by 2px to account for the border width
        this.cellEditor.style.width = `${this.widthArray[col]! + 2}px`;
        this.cellEditor.style.height = `${this.heightArray[row]! + 2}px`;
    }

    private commitCurrentEdit(): void {
        if (!this.editingCell) return;
        const { row, col } = this.editingCell;
        const value = this.cellEditor.value.trim();

        // Initialize parent index structural maps safely on demand
        if (!this.gridData[row]) {
            this.gridData[row] = {};
        }

        // Save input value straight back into program heap state memory allocations
        if (value === '') {
            delete this.gridData[row][col]; // Garbage collect matrix points to keep clean profile
        } else {
            this.gridData[row][col] = value;
        }

        this.closeEditor();
    }

    private cancelCurrentEdit(): void {
        this.closeEditor();
    }

    private closeEditor(): void {
        this.editingCell = null;
        this.cellEditor.style.display = 'none';
        this.scrollContainer.focus(); // Return tracking focus safely to main viewport layout loop
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

        const startCol = Math.floor(this.scrollX / this.colWidth);
        const endCol = Math.min(this.maxCols - 1, Math.ceil((this.scrollX + viewWidth) / this.colWidth));

        const startRow = Math.floor(this.scrollY / this.rowHeight);
        const endRow = Math.min(this.maxRows - 1, Math.ceil((this.scrollY + viewHeight) / this.rowHeight));

        for (let r = startRow; r <= endRow; r++) {
            const cellTopY = this.prefHeightArray[r]! - this.scrollY + this.headerHeight;

            for (let c = startCol; c <= endCol; c++) {
                const cellLeftX = this.prefWidthArray[c]! - this.scrollX + this.headerWidth;

                this.ctx.strokeStyle = '#e0e0e0';
                this.ctx.strokeRect(cellLeftX, cellTopY, this.widthArray[c]!, this.heightArray[r]!);

                const textVal = this.gridData[r]?.[c];
                // Skip rendering cell content text strings if it's currently covered by the HTML text input overlay
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
        // Draw the Excel selection frame box if a target cell coordinate index is active
        if (!this.selectedCell || this.editingCell) return;

        const { row, col } = this.selectedCell;
        const x = this.prefWidthArray[col]! - this.scrollX;
        const y = this.prefHeightArray[row]! - this.scrollY;

        // Skip rendering the outline frame if the target has scrolled out of view
        if (x + this.colWidth < this.headerWidth || y + this.rowHeight < this.headerHeight) return;

        this.ctx.strokeStyle = '#107c41';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, this.widthArray[col]!, this.heightArray[row]!);
    }

    private drawVirtualHeaders(viewWidth: number, viewHeight: number): void {
        this.ctx.font = '500 11px sans-serif';
        this.ctx.textAlign = 'center';

        const startCol = Math.floor(this.scrollX / this.colWidth);
        const endCol = Math.min(this.maxCols - 1, Math.ceil((this.scrollX + viewWidth) / this.colWidth));

        const startRow = Math.floor(this.scrollY / this.rowHeight); 
        const endRow = Math.min(this.maxRows - 1, Math.ceil((this.scrollY + viewHeight) / this.rowHeight));
        for (let c = startCol;
            c <= endCol;
            c++) {
            const x = this.prefWidthArray[c]! - this.scrollX;
            this.ctx.fillStyle = '#f8f9fa';
            this.ctx.fillRect(x, 0, this.widthArray[c]!, this.headerHeight);
            this.ctx.strokeStyle = '#c0c0c0';

            this.ctx.strokeRect(x, 0, this.widthArray[c]!, this.headerHeight);

            this.ctx.fillStyle = '#444444';
            this.ctx.fillText(this.generateColumnLabel(c), x + (this.widthArray[c]! / 2), 19);
        } 
        for (let r = startRow;
            r <= endRow;
            r++) {
            const y = this.prefHeightArray[r]! - this.scrollY;
            this.ctx.fillStyle = '#f8f9fa';
            this.ctx.fillRect(0, y, this.headerWidth, this.heightArray[r]!);
            this.ctx.strokeStyle = '#c0c0c0';
            this.ctx.strokeRect(0, y, this.headerWidth, this.heightArray[r]!);
            this.ctx.fillStyle = '#444444';
            this.ctx.fillText((r + 1).toString(), this.headerWidth / 2, y + 16);

        } this.ctx.fillStyle = '#e8eaed';
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

        } return label;
    }
}
window.addEventListener('load', () => {
    const grid = new ExcelVirtualScroller();
    window.addEventListener('resize', () => grid.initCanvasScaling());

});