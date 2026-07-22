import { headerHeight, headerWidth, HEADER_SELECTION_SENTINEL } from "./Constants/Constant.js";
import type { Cell, GridData, GridResolution, RangeSummary } from "./models/Types.js";
import { SampleDatasetGenerator } from "./models/SampleDatasetGenerator.js";
import { GridGeometry } from "./geometry/GridGeometry.js";
import { ViewportManager } from "./viewport/ViewportManager.js";
import { GridDataStore } from "./data/GridDataStore.js";
import { JsonDataLoader } from "./data/JsonDataLoader.js";
import { SummaryCalculator } from "./calculation/SummaryCalculator.js";
import { SelectionManager } from "./selection/SelectionManager.js";
import { EditManager } from "./editing/EditManager.js";
import { ResizeController } from "./resizing/ResizeController.js";
import { GridRenderer } from "./rendering/GridRenderer.js";
import { CommandManager } from "./commands/CommandManager.js";
import { EditCellCommand } from "./commands/EditCellCommand.js";
import { ResizeColumnCommand } from "./commands/ResizeColumnCommand.js";
import { ResizeRowCommand } from "./commands/ResizeRowCommand.js";
import { CellSelectionController } from "./selection/CellSelectionController.js";
import { RowSelectionController } from "./selection/RowSelectionController.js";
import { ColumnSelectionController } from "./selection/ColumnSelectionController.js";
import { AllSelectionController } from "./selection/AllSelectionController.js";
import type { SelectionRange } from "./models/Types.js";
import type { selectionMode } from "./models/Types.js";
import { ColumnResizeController } from "./resizing/ColumnResizeController.js";
import { RowResizeController } from "./resizing/RowResizeController.js";

export class Grid {
    private readonly canvas: HTMLCanvasElement;
    private readonly ctx: CanvasRenderingContext2D;
    private readonly canvasShell: HTMLDivElement;

    private readonly scrollContainer: HTMLDivElement;
    private readonly scrollContent: HTMLDivElement;
    private readonly cellEditor: HTMLInputElement;
    private readonly summaryCount: HTMLElement;
    private readonly summaryMin: HTMLElement;
    private readonly summaryMax: HTMLElement;
    private readonly summarySum: HTMLElement;
    private readonly summaryAverage: HTMLElement;
    private readonly jsonFileInput: HTMLInputElement | null;
    private readonly jsonStatus: HTMLElement | null;

    private scrollX = 0;
    private scrollY = 0;

    private readonly geometry = new GridGeometry();
    private readonly viewport = new ViewportManager(this.geometry);
    private readonly dataStore = new GridDataStore(SampleDatasetGenerator.generate());
    private readonly summaryCalculator = new SummaryCalculator(this.dataStore);

    private activeHandler: CellSelectionController | RowSelectionController | ColumnSelectionController | AllSelectionController|ColumnResizeController|RowResizeController | null = null
    private handlers: (CellSelectionController | RowSelectionController | ColumnSelectionController | AllSelectionController|ColumnResizeController|RowResizeController)[];
    private cellSelector: CellSelectionController;
    private columnSelector: ColumnSelectionController;
    private RowSelector: RowSelectionController;
    private AllSelector: AllSelectionController;
    private ColRes : ColumnResizeController;
    private RowRes: RowResizeController;






    // private readonly resize = new ResizeController(this.geometry);
    private readonly commandManager = new CommandManager();

    private readonly editor: EditManager;
    private readonly renderer: GridRenderer;
    private readonly selectionManager;

    public selectedCell: Cell | null = null;
    public selectionRange: SelectionRange | null = null;
    public mode: selectionMode = 'cell';

    constructor() {
        this.canvas = document.getElementById('excelCanvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        this.canvasShell = document.getElementById('canvas-shell') as HTMLDivElement;

        this.scrollContainer = document.getElementById('scroll-container') as HTMLDivElement;
        this.scrollContent = document.getElementById('scroll-content') as HTMLDivElement;
        this.cellEditor = document.getElementById('cell-editor') as HTMLInputElement;
        this.summaryCount = document.getElementById('summary-count') as HTMLElement;
        this.summaryMin = document.getElementById('summary-min') as HTMLElement;
        this.summaryMax = document.getElementById('summary-max') as HTMLElement;
        this.summarySum = document.getElementById('summary-sum') as HTMLElement;
        this.summaryAverage = document.getElementById('summary-average') as HTMLElement;
        this.jsonFileInput = document.getElementById('json-file-input') as HTMLInputElement | null;
        this.jsonStatus = document.getElementById('json-status') as HTMLElement | null;


        this.selectionManager = new SelectionManager(this.selectedCell,this.selectionRange,this.mode)
        this.cellSelector = new CellSelectionController(this.selectionManager);
        this.columnSelector = new ColumnSelectionController(this.selectionManager);
        this.RowSelector = new RowSelectionController(this.selectionManager);
        this.AllSelector = new AllSelectionController(this.selectionManager);
        this.ColRes = new ColumnResizeController(this.geometry,this.scrollContent,this.commandManager);
        this.RowRes = new RowResizeController(this.geometry,this.scrollContent,this.commandManager);

        this.handlers = [this.ColRes,this.RowRes,this.AllSelector, this.RowSelector, this.columnSelector, this.cellSelector,]

        this.editor = new EditManager(
            this.cellEditor,
            this.geometry,
            this.dataStore,
            (row, col, oldValue, newValue) => {
                const command = new EditCellCommand(this.dataStore, row, col, oldValue, newValue);
                this.commandManager.executeCommand(command);
            },
        );

        this.renderer = new GridRenderer(this.ctx, this.geometry, this.dataStore);

        this.syncVirtualScrollDimensions();
        this.initCanvasScaling();
        this.setupScrollBinding();
        this.setupInteractionListeners();
        this.setupJsonImport();
    }

    private syncVirtualScrollDimensions(): void {
        this.scrollContent.style.width = `${this.geometry.getTotalWidth()}px`;
        this.scrollContent.style.height = `${this.geometry.getTotalHeight()}px`;
    }

    public initCanvasScaling(): void {
        const dpr = window.devicePixelRatio || 1;
        const w = this.canvasShell.clientWidth;
        const h = this.canvasShell.clientHeight;

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

    private toGridPoint(clientX: number, clientY: number): { screenX: number; screenY: number; gridX: number; gridY: number } {
        const rect = this.canvasShell.getBoundingClientRect();
        const screenX = clientX - rect.left;
        const screenY = clientY - rect.top;
        return {
            screenX,
            screenY,
            gridX: screenX - headerWidth + this.scrollX,
            gridY: screenY - headerHeight + this.scrollY,
        };
    }


    public getCellCoordsFromPointerEvent(clientX: number, clientY: number): Cell {
        const { gridX, gridY } = this.toGridPoint(clientX, clientY);
        const col = this.geometry.getColumnAtX(gridX);
        const row = this.geometry.getRowAtY(gridY);
        return { row, col };
    }


    private resolveSelectionStart(e: PointerEvent): Cell {
        const { screenX, screenY, gridX, gridY } = this.toGridPoint(e.clientX, e.clientY);
        const inColumnHeaderStrip = screenY < headerHeight;
        const inRowHeaderStrip = screenX < headerWidth;

        if (inColumnHeaderStrip && inRowHeaderStrip) {
            return { row: HEADER_SELECTION_SENTINEL, col: HEADER_SELECTION_SENTINEL };
        }
        if (inColumnHeaderStrip) {
            return { row: HEADER_SELECTION_SENTINEL, col: this.geometry.getColumnAtX(gridX) };
        }
        if (inRowHeaderStrip) {
            return { row: this.geometry.getRowAtY(gridY), col: HEADER_SELECTION_SENTINEL };
        }
        return { row: this.geometry.getRowAtY(gridY), col: this.geometry.getColumnAtX(gridX) };
    }

    private setupInteractionListeners(): void {
        this.canvasShell.addEventListener('pointerdown', (e: PointerEvent) =>this.handlePointerDown(e));
        document.addEventListener('pointermove', (e: PointerEvent) => this.handlePointerMove(e));
        document.addEventListener('pointerup', (e: PointerEvent) => this.handlePointerUp(e));

        this.scrollContainer.addEventListener('dblclick', (e: MouseEvent) => {
            const cell = this.getCellCoordsFromPointerEvent(e.clientX, e.clientY);
            this.editor.startEditing(cell.row, cell.col, this.scrollX, this.scrollY);
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

    private setupJsonImport(): void {
        if (!this.jsonFileInput) return;

        this.jsonFileInput.addEventListener('change', () => {
            const file = this.jsonFileInput!.files?.[0];
            if (!file) return;

            JsonDataLoader.loadFromFile(file)
                .then((newData) => {
                    this.loadNewData(newData);
                    this.setJsonStatus(`Loaded "${file.name}".`, false);
                })
                .catch((err: unknown) => {
                    const message = err instanceof Error ? err.message : 'Failed to load JSON file.';
                    this.setJsonStatus(message, true);
                })
                .finally(() => {
                    this.jsonFileInput!.value = '';
                });
        });
    }

    private loadNewData(newData: GridData): void {
        this.editor.cancel();
        this.dataStore.loadData(newData);
        this.commandManager.clear();
        // this.selection.selectedCell = null;
        // this.selection.selectionRange = null;
        this.scrollContainer.scrollTo(0, 0);
        this.scrollX = 0;
        this.scrollY = 0;
        this.draw();
    }

    private setJsonStatus(message: string, isError: boolean): void {
        if (!this.jsonStatus) return;
        this.jsonStatus.textContent = message;
        this.jsonStatus.classList.toggle('json-status-error', isError);
    }

    private handlePointerDown(e: PointerEvent): void {
        this.editor.blur(); // commits any in-progress edit via the blur listener

        const resolution:GridResolution = this.toGridPoint(e.clientX, e.clientY);
        if (this.editor.isEditing()) {
            this.editor.commit();
        }
        const cell = this.resolveSelectionStart(e);
        // this.selection.startSelection(cell);
        for (let i = 0; i < this.handlers.length; i++) {
            if (this.handlers[i]!.hitTest(cell,resolution,e)) {
                this.activeHandler = this.handlers[i]!
                break
            }
        }
        this.activeHandler?.handlePointerDown(e)
        this.updateSummaryBar();
        this.draw();
    }

    private handlePointerMove(e: PointerEvent): void {
            const cell = this.getCellCoordsFromPointerEvent(e.clientX, e.clientY);
            this.activeHandler?.handlePointerMove(cell,e);
            this.updateSummaryBar();
            this.draw();

        this.updateHoverCursor(e);
    }

    private handlePointerUp(e: PointerEvent): void {
            const cell = this.getCellCoordsFromPointerEvent(e.clientX, e.clientY);
            this.activeHandler?.handlePointerUp(cell,e);
            // this.activeHandler?.endSelection();
            this.updateSummaryBar();
            this.draw();
    }

    private updateHoverCursor(e: PointerEvent): void {
        const { screenX, screenY, gridX, gridY } = this.toGridPoint(e.clientX, e.clientY);
        const nearTopStrip = screenY <= headerHeight;
        const nearLeftStrip = screenX <= headerWidth;

        const resizeCursor = this.activeHandler!.getHoverCursor(gridX, gridY, nearTopStrip, nearLeftStrip);
        if (resizeCursor !== 'default') {
            this.canvasShell.style.cursor = resizeCursor;
            return;
        }
        this.canvasShell.style.cursor = (nearTopStrip || nearLeftStrip) ? 'cell' : 'default';
    }

    private handleGlobalKeyDown(e: KeyboardEvent): void {
        if (document.activeElement === this.cellEditor) return;

        const modifier = e.ctrlKey || e.metaKey;
        const key = e.key.toLowerCase();

        if (modifier && key === 'z' && !e.shiftKey) {
            e.preventDefault();
            this.commandManager.undo();
            this.syncVirtualScrollDimensions();
            this.draw();
            return;
        }
        if (modifier && (key === 'y' || (key === 'z' && e.shiftKey))) {
            e.preventDefault();
            this.commandManager.redo();
            this.syncVirtualScrollDimensions();
            this.draw();
            return;
        }
        if (!modifier && this.selectedCell && (e.key === 'Delete' || e.key === 'Backspace')) {
            const { row, col } = this.selectedCell;
            if (row === HEADER_SELECTION_SENTINEL || col === HEADER_SELECTION_SENTINEL) return;
            const oldValue = this.dataStore.getValue(row, col);
            if (oldValue === '') return;

            const command = new EditCellCommand(this.dataStore, row, col, oldValue, '');
            this.commandManager.executeCommand(command);
            this.draw();
        }
    }

    public draw(): void {
        // this.updateSummaryBar();

        const viewWidth = this.canvasShell.clientWidth;
        const viewHeight = this.canvasShell.clientHeight;
        const visibleRange = this.viewport.getVisibleRange(viewWidth, viewHeight, this.scrollX, this.scrollY);

        this.renderer.draw(
            viewWidth,
            viewHeight,
            this.scrollX,
            this.scrollY,
            visibleRange,
            // this.selection,
            this.selectionManager,
            this.editor.editingCell,
        );
    }

    private updateSummaryBar(): void {
        const summary = this.getCurrentSelectionSummary();

        this.summaryCount.textContent = summary.count.toString();
        this.summaryMin.textContent = this.formatSummaryValue(summary.min);
        this.summaryMax.textContent = this.formatSummaryValue(summary.max);
        this.summarySum.textContent = this.formatSummaryValue(summary.sum);
        this.summaryAverage.textContent = this.formatSummaryValue(summary.average);
    }

    private getCurrentSelectionSummary(): RangeSummary {
        // const range = this.selection.selectionRange;
        const range = this.selectionRange;
        if (!range) {
            return { count: 0, min: null, max: null, sum: 0, average: null };
        }
        return this.summaryCalculator.calculate(range);
    }

    private formatSummaryValue(value: number | null): string {
        return value === null ? '—' : value.toString();
    }
}
