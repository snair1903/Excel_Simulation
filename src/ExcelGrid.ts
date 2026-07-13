import { initialSparseData, type Cell, type EditAction } from "./models.js";
import { GridGeometry } from "./GridGeometry.js";
import { GridDataStore } from "./GridDataStore.js";
import { HistoryManager } from "./HistoryManager.js";
import { SelectionManager } from "./SelectionManager.js";
import { CellEditorController } from "./CellEditorController.js";
import { ResizeController } from "./ResizeController.js";
import { GridRenderer } from "./GridRenderer.js";
import { headerHeight,headerWidth } from "./Constants/Constant.js";

export class ExcelGrid {
    private readonly canvas: HTMLCanvasElement;
    private readonly ctx: CanvasRenderingContext2D;

    private readonly scrollContainer: HTMLDivElement;
    private readonly scrollContent: HTMLDivElement;
    private readonly cellEditor: HTMLInputElement;

    private scrollX = 0;
    private scrollY = 0;

    private readonly geometry = new GridGeometry();
    private readonly dataStore = new GridDataStore(initialSparseData);
    private readonly selection = new SelectionManager();
    private readonly resize = new ResizeController(this.geometry);
    private readonly history = new HistoryManager((action, isUndo) => this.applyAction(action, isUndo));

    private readonly editor: CellEditorController;
    private readonly renderer: GridRenderer;

    constructor() {
        this.canvas = document.getElementById('excelCanvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;

        this.scrollContainer = document.getElementById('scroll-container') as HTMLDivElement;
        this.scrollContent = document.getElementById('scroll-content') as HTMLDivElement;
        this.cellEditor = document.getElementById('cell-editor') as HTMLInputElement;

        this.editor = new CellEditorController(
            this.cellEditor,
            this.geometry,
            this.dataStore,
            (row, col, oldValue, newValue) => {
                this.history.push({ type: 'cell-edit', row, col, oldValue, newValue });
                this.dataStore.setValue(row, col, newValue);
            },
        );

        this.renderer = new GridRenderer(this.ctx, this.geometry, this.dataStore);

        this.syncVirtualScrollDimensions();
        this.initCanvasScaling();
        this.setupScrollBinding();
        this.setupInteractionListeners();
    }

    private syncVirtualScrollDimensions(): void {
        this.scrollContent.style.width = `${this.geometry.getTotalWidth()}px`;
        this.scrollContent.style.height = `${this.geometry.getTotalHeight()}px`;
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

            if (this.editor.isEditing()) {
                this.editor.reposition(this.scrollX, this.scrollY);
            }

            this.draw();
        });
    }

    private toGridPoint(e: MouseEvent): { screenX: number; screenY: number; gridX: number; gridY: number } {
        const rect = this.scrollContainer.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        console.log(screenX,screenY)
        return {
            screenX,
            screenY,
            gridX: screenX + this.scrollX,
            gridY: screenY + this.scrollY,
        };
    }

    private getCellCoordsFromMouseEvent(e: MouseEvent): Cell | null {
        console.log("hii")
        const { screenX,screenY, gridX, gridY } = this.toGridPoint(e);
        console.log(gridX,gridY)
        let col =0;
        let row =0;
        if(screenX<0)
            { col = -1}
        else
            { col = this.geometry.getColumnAtX(gridX);}
        if(screenY<0)
            { row = -1}
        else
            { row = this.geometry.getRowAtY(gridY);}
        console.log(row,col,"rowcol");
       
        return {row,col};
    }


    private setupInteractionListeners(): void {
        this.scrollContainer.addEventListener('mousedown', (e: MouseEvent) => this.handleMouseDown(e));
        document.addEventListener('mousemove', (e: MouseEvent) => this.handleMouseMove(e));
        document.addEventListener('mouseup', (e: MouseEvent) => this.handleMouseUp(e));

        this.scrollContainer.addEventListener('dblclick', (e: MouseEvent) => {
            const cell = this.getCellCoordsFromMouseEvent(e);
            if (cell) {
                this.editor.startEditing(cell.row, cell.col, this.scrollX, this.scrollY);
                this.selection.selectedCell = cell;
            }
            this.selection.endSelection();
            this.draw();
        });

        this.cellEditor.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                this.editor.commit();
                this.scrollContainer.focus();
                this.draw();
            } else if (e.key === 'Escape') {
                this.editor.cancel();
                this.scrollContainer.focus();
                this.draw();
            }
        });

        this.cellEditor.addEventListener('blur', () => {
            if (this.editor.isEditing()) {
                this.editor.commit();
                this.draw();
            }
        });

        window.addEventListener('keydown', (e: KeyboardEvent) => this.handleGlobalKeyDown(e));
    }

    private handleMouseDown(e: MouseEvent): void {
        this.editor.blur(); // commits any in-progress edit via the blur listener

        const { screenX, screenY, gridX, gridY } = this.toGridPoint(e);

        const nearTopStrip = screenY <= headerHeight;
        const nearLeftStrip = screenX <= headerWidth;

        const startedResize = this.resize.tryStartFromGridPoint(
            nearTopStrip ? gridX : null,
            nearLeftStrip ? gridY : null,
            e.clientX,
            e.clientY,
        );

        if (startedResize) {
            e.preventDefault();
            return;
        }

        if (this.editor.isEditing()) {
            this.editor.commit();
        }
        console.log("a")
        const cell = this.getCellCoordsFromMouseEvent(e);
        console.log(cell,"b")
        if (cell) {
            this.selection.startSelection(cell);
            this.draw();
        }
    }

    private handleMouseMove(e: MouseEvent): void {
        if (this.selection.isSelecting) {
            const cell = this.getCellCoordsFromMouseEvent(e);
            if (cell) this.selection.updateSelection(cell);
            this.draw();
            return;
        }

        if (this.resize.isResizing()) {
            this.resize.queueDrag(e, () => {
                if (this.resize.processDrag()) {
                    this.syncVirtualScrollDimensions();
                    this.draw();
                }
            });
            return;
        }

        this.updateHoverCursor(e);
    }

    private handleMouseUp(e: MouseEvent): void {
        if (this.selection.isSelecting) {
            const cell = this.getCellCoordsFromMouseEvent(e);
            if (cell) this.selection.updateSelection(cell);
            this.selection.endSelection();
            this.draw();
            return;
        }

        if (this.resize.isResizing()) {
            if (this.resize.hasPendingFrame()) {
                this.resize.processDrag();
            }
            for (const result of this.resize.finalize()) {
                if (result.type === 'col-resize') {
                    this.history.push({ type: 'col-resize', col: result.index, oldWidth: result.oldSize, newWidth: result.newSize });
                } else {
                    this.history.push({ type: 'row-resize', row: result.index, oldHeight: result.oldSize, newHeight: result.newSize });
                }
            }
            this.syncVirtualScrollDimensions();
            this.draw();
        }
    }

    private updateHoverCursor(e: MouseEvent): void {
        const { screenX, screenY, gridX, gridY } = this.toGridPoint(e);
        const nearTopStrip = screenY <= headerHeight;
        const nearLeftStrip = screenX <= headerWidth;

        this.scrollContainer.style.cursor = this.resize.getHoverCursor(gridX, gridY, nearTopStrip, nearLeftStrip);
    }

    private handleGlobalKeyDown(e: KeyboardEvent): void {
        if (document.activeElement === this.cellEditor) return;

        const modifier = e.ctrlKey || e.metaKey;
        const key = e.key.toLowerCase();

        if (modifier && key === 'z' && !e.shiftKey) {
            e.preventDefault();
            this.history.undo();
            this.draw();
            return;
        }
        if (modifier && (key === 'y' || (key === 'z' && e.shiftKey))) {
            e.preventDefault();
            this.history.redo();
            this.draw();
            return;
        }
        if (!modifier && this.selection.selectedCell && (e.key === 'Delete' || e.key === 'Backspace')) {
            const { row, col } = this.selection.selectedCell;
            const oldValue = this.dataStore.getValue(row, col);
            if (oldValue === '') return;
            this.history.push({ type: 'cell-edit', row, col, oldValue, newValue: '' });
            this.dataStore.setValue(row, col, '');
            this.draw();
        }
    }


    private applyAction(action: EditAction, isUndo: boolean): void {
        switch (action.type) {
            case 'cell-edit': {
                const value = isUndo ? action.oldValue : action.newValue;
                this.dataStore.setValue(action.row, action.col, value);
                break;
            }
            case 'col-resize': {
                const width = isUndo ? action.oldWidth : action.newWidth;
                this.geometry.setColumnWidth(action.col, width);
                this.syncVirtualScrollDimensions();
                break;
            }
            case 'row-resize': {
                const height = isUndo ? action.oldHeight : action.newHeight;
                this.geometry.setRowHeight(action.row, height);
                this.syncVirtualScrollDimensions();
                break;
            }
        }
        this.draw();
    }


    public draw(): void {
        this.renderer.draw(
            window.innerWidth,
            window.innerHeight,
            this.scrollX,
            this.scrollY,
            this.selection,
            this.editor.editingCell,
        );
    }
}
