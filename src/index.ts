import { initialSparseData, type Cell, type GridData } from "./models.js";

class ExcelVirtualScroller {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    private scrollContainer: HTMLDivElement;
    private scrollContent: HTMLDivElement;
    private cellEditor: HTMLInputElement; // Floating edit box link

    private colWidth = 100;


    
    private rowHeight = 25;
    private headerWidth = 60;
    private headerHeight = 30;

    private maxRows = 100000;
    private maxCols = 500;

    private scrollX = 0;
    private scrollY = 0;

    // arrays for width and height
    private widthArray:number[] ;
    private heightArray:number[];

    //Prefixs
    private prefWidthArray:number[];
    private prefHeightArray:number[];


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

    private prefixGenerator():void{
        let sum = 0;
        for(let i = 0;i<this.maxCols;i++){
            sum = sum+this.widthArray[i]!; 
            this.prefWidthArray[i] = sum;
        }
        sum = 0
        for(let i = 0;i<this.maxRows;i++){
            sum = sum+this.heightArray[i]!; 
            this.prefHeightArray[i] = sum;
        }
    }

    private setupInteractionListeners(): void {
        // Handle Cell Selecting via Single-Click
        this.scrollContainer.addEventListener('mousedown', (e: MouseEvent) => {
            // Commit any open changes if user clicks away to select a different target cell
            if (this.editingCell) {
                this.commitCurrentEdit();
            }

            const cell = this.getCellCoordsFromMouseEvent(e);
            if (cell) {
                this.selectedCell = cell;
                this.draw();
            }
        });

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

    private getCellCoordsFromMouseEvent(e: MouseEvent): Cell | null {
        const rect = this.scrollContainer.getBoundingClientRect();

        // Calculate absolute grid pixels by combining click offset positioning parameters with current viewport offsets
        const absoluteGridX = (e.clientX - rect.left) + this.scrollX;
        const absoluteGridY = (e.clientY - rect.top) + this.scrollY;

        const col = Math.floor(absoluteGridX / this.colWidth);
        const row = Math.floor(absoluteGridY / this.rowHeight);

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
    const viewX = this.headerWidth + (col * this.colWidth) - this.scrollX;
    const viewY = this.headerHeight + (row * this.rowHeight) - this.scrollY;

    // Shift positions left and up by 1px to cleanly align the border 
    // over the original 1px gray grid lines
    this.cellEditor.style.left = `${viewX - 1}px`;
    this.cellEditor.style.top = `${viewY - 1}px`;
    
    // Expand sizing parameters by 2px to account for the border width
    this.cellEditor.style.width = `${this.colWidth + 2}px`; 
    this.cellEditor.style.height = `${this.rowHeight + 2}px`;
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
            const cellTopY = this.headerHeight + (r * this.rowHeight) - this.scrollY;

            for (let c = startCol; c <= endCol; c++) {
                const cellLeftX = this.headerWidth + (c * this.colWidth) - this.scrollX;

                this.ctx.strokeStyle = '#e0e0e0';
                this.ctx.strokeRect(cellLeftX, cellTopY, this.colWidth, this.rowHeight);

                const textVal = this.gridData[r]?.[c];
                // Skip rendering cell content text strings if it's currently covered by the HTML text input overlay
                const isBeingEdited = this.editingCell && this.editingCell.row === r && this.editingCell.col === c;

                if (textVal && !isBeingEdited) {
                    this.ctx.fillStyle = '#1c1c1c';
                    this.ctx.textAlign = 'left';
                    this.ctx.fillText(textVal, cellLeftX + 6, cellTopY + 17, this.colWidth - 12);
                }
            }
        }
    }

    private drawSelectionHighlight(): void {
        // Draw the Excel selection frame box if a target cell coordinate index is active
        if (!this.selectedCell || this.editingCell) return;

        const { row, col } = this.selectedCell;
        const x = this.headerWidth + (col * this.colWidth) - this.scrollX;
        const y = this.headerHeight + (row * this.rowHeight) - this.scrollY;

        // Skip rendering the outline frame if the target has scrolled out of view
        if (x + this.colWidth < this.headerWidth || y + this.rowHeight < this.headerHeight) return;

        this.ctx.strokeStyle = '#107c41';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, this.colWidth, this.rowHeight);
    }

    private drawVirtualHeaders(viewWidth: number, viewHeight: number): void {
        this.ctx.font = '500 11px sans-serif';
        this.ctx.textAlign = 'center';

        const startCol = Math.floor(this.scrollX / this.colWidth);
        const endCol = Math.min(this.maxCols - 1, Math.ceil((this.scrollX + viewWidth) / this.colWidth));

        const startRow = Math.floor(this.scrollY / this.rowHeight); const endRow = Math.min(this.maxRows - 1, Math.ceil((this.scrollY + viewHeight) / this.rowHeight));
        for (let c = startCol;
            c <= endCol;
            c++) {
            const x = this.headerWidth + (c * this.colWidth) - this.scrollX;
            this.ctx.fillStyle = '#f8f9fa';
            this.ctx.fillRect(x, 0, this.colWidth, this.headerHeight);
            this.ctx.strokeStyle = '#c0c0c0';

            this.ctx.strokeRect(x, 0, this.colWidth, this.headerHeight);

            this.ctx.fillStyle = '#444444';
            this.ctx.fillText(this.generateColumnLabel(c), x + (this.colWidth / 2), 19);
        } for (let r = startRow;
            r <= endRow;
            r++) {
                const y = this.headerHeight + (r * this.rowHeight) - this.scrollY;
            this.ctx.fillStyle = '#f8f9fa';
            this.ctx.fillRect(0, y, this.headerWidth, this.rowHeight);
            this.ctx.strokeStyle = '#c0c0c0';
            this.ctx.strokeRect(0, y, this.headerWidth, this.rowHeight);
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