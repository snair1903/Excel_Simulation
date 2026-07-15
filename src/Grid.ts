import { headerHeight, headerWidth, HEADER_SELECTION_SENTINEL } from "./Constants/Constant.js";
import type { Cell, GridData, RangeSummary } from "./models/Types.js";
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
    private readonly selection = new SelectionManager();
    private readonly resize = new ResizeController(this.geometry);
    private readonly commandManager = new CommandManager();

    private readonly editor: EditManager;
    private readonly renderer: GridRenderer;

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

    private toGridPoint(e: MouseEvent): { screenX: number; screenY: number; gridX: number; gridY: number } {
        const rect = this.canvasShell.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        return {
            screenX,
            screenY,
            gridX: screenX - headerWidth + this.scrollX,
            gridY: screenY - headerHeight + this.scrollY,
        };
    }

    /** Resolves the cell under the cursor for drag-continuation purposes. Always returns a value
     *  clamped to the grid bounds (clicks above/left of the grid clamp to row/col 0). */
    private getCellCoordsFromMouseEvent(e: MouseEvent): Cell {
        const { gridX, gridY } = this.toGridPoint(e);
        const col = this.geometry.getColumnAtX(gridX);
        const row = this.geometry.getRowAtY(gridY);
        return { row, col };
    }

    /** Resolves what a mousedown should start selecting: a single cell, or - if the click landed in
     *  a header strip - an entire row, an entire column, or (top-left corner) the whole sheet. */
    private resolveSelectionStart(e: MouseEvent): Cell {
        const { screenX, screenY, gridX, gridY } = this.toGridPoint(e);
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
        this.canvasShell.addEventListener('mousedown', (e: MouseEvent) => this.handleMouseDown(e));
        document.addEventListener('mousemove', (e: MouseEvent) => this.handleMouseMove(e));
        document.addEventListener('mouseup', (e: MouseEvent) => this.handleMouseUp(e));

        this.scrollContainer.addEventListener('dblclick', (e: MouseEvent) => {
            const cell = this.getCellCoordsFromMouseEvent(e);
            this.editor.startEditing(cell.row, cell.col, this.scrollX, this.scrollY);
            this.selection.selectedCell = cell;
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
        this.selection.selectedCell = null;
        this.selection.selectionRange = null;
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

        const cell = this.resolveSelectionStart(e);
        this.selection.startSelection(cell);
        this.draw();
    }

    private handleMouseMove(e: MouseEvent): void {
        if (this.selection.isSelecting) {
            const cell = this.getCellCoordsFromMouseEvent(e);
            this.selection.updateSelection(cell);
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
            this.selection.updateSelection(cell);
            this.selection.endSelection();
            this.draw();
            return;
        }

        if (this.resize.isResizing()) {
            if (this.resize.hasPendingFrame()) {
                this.resize.processDrag();
            }
            for (const result of this.resize.finalize()) {
                // The drag already applied the new size live; we only need to register
                // the completed action so it becomes undoable (see CommandManager.registerExecuted).
                if (result.type === 'col-resize') {
                    const command = new ResizeColumnCommand(this.geometry.columns, result.index, result.oldSize, result.newSize);
                    this.commandManager.registerExecuted(command);
                } else {
                    const command = new ResizeRowCommand(this.geometry.rows, result.index, result.oldSize, result.newSize);
                    this.commandManager.registerExecuted(command);
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

        const resizeCursor = this.resize.getHoverCursor(gridX, gridY, nearTopStrip, nearLeftStrip);
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
        if (!modifier && this.selection.selectedCell && (e.key === 'Delete' || e.key === 'Backspace')) {
            const { row, col } = this.selection.selectedCell;
            if (row === HEADER_SELECTION_SENTINEL || col === HEADER_SELECTION_SENTINEL) return;
            const oldValue = this.dataStore.getValue(row, col);
            if (oldValue === '') return;

            const command = new EditCellCommand(this.dataStore, row, col, oldValue, '');
            this.commandManager.executeCommand(command);
            this.draw();
        }
    }

    public draw(): void {
        this.updateSummaryBar();

        const viewWidth = this.canvasShell.clientWidth;
        const viewHeight = this.canvasShell.clientHeight;
        const visibleRange = this.viewport.getVisibleRange(viewWidth, viewHeight, this.scrollX, this.scrollY);

        this.renderer.draw(
            viewWidth,
            viewHeight,
            this.scrollX,
            this.scrollY,
            visibleRange,
            this.selection,
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
        const range = this.selection.selectionRange;
        if (!range) {
            return { count: 0, min: null, max: null, sum: 0, average: null };
        }
        return this.summaryCalculator.calculate(range);
    }

    private formatSummaryValue(value: number | null): string {
        return value === null ? '—' : value.toString();
    }
}
