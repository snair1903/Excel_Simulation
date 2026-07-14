import type { Cell } from "./models.js";
import { GridGeometry } from "./GridGeometry.js";
import { GridDataStore } from "./GridDataStore.js";
import { headerHeight,headerWidth,editorBorderInsetPx,editorSizePaddingPx } from "./Constants/Constant.js";

export class CellEditorController {
    public editingCell: Cell | null = null;
    private isCommitting = false;

    constructor(
        private readonly cellEditor: HTMLInputElement,
        private readonly geometry: GridGeometry,
        private readonly dataStore: GridDataStore,
        private readonly onCommit: (row: number, col: number, oldValue: string, newValue: string) => void,
    ) {}

    public isEditing(): boolean {
        return this.editingCell !== null;
    }

    public isActiveElement(): boolean {
        return document.activeElement === this.cellEditor;
    }

    public startEditing(row: number, col: number, scrollX: number, scrollY: number): void {
        this.editingCell = { row, col };

        this.cellEditor.value = this.dataStore.getValue(row, col);
        this.reposition(scrollX, scrollY);

        this.cellEditor.style.display = 'block';
        this.cellEditor.focus();
        this.cellEditor.select();
    }

    public reposition(scrollX: number, scrollY: number): void {
        if (!this.editingCell) return;
        const { row, col } = this.editingCell;

        const viewX = this.geometry.getColumnStart(col) - scrollX + headerWidth;
        const viewY = this.geometry.getRowStart(row) - scrollY + headerHeight;

        this.cellEditor.style.left = `${viewX - editorBorderInsetPx}px`;
        this.cellEditor.style.top = `${viewY - editorBorderInsetPx}px`;
        this.cellEditor.style.width = `${this.geometry.widthArray[col]! + editorSizePaddingPx}px`;
        this.cellEditor.style.height = `${this.geometry.heightArray[row]! + editorSizePaddingPx}px`;
    }

    /** Requests that focus leave the input, which triggers commit via the blur listener. */
    public blur(): void {
        if (this.editingCell && this.isActiveElement()) {
            this.cellEditor.blur();
        }
    }

    public commit(): void {
        if (!this.editingCell || this.isCommitting) return;
        this.isCommitting = true;

        const { row, col } = this.editingCell;
        const newValue = this.cellEditor.value.trim();
        const oldValue = this.dataStore.getValue(row, col);

        if (newValue !== oldValue) {
            this.onCommit(row, col, oldValue, newValue);
        }

        this.close();
        this.isCommitting = false;
    }

    public cancel(): void {
        this.close();
    }

    private close(): void {
        this.editingCell = null;
        this.cellEditor.style.display = 'none';
    }
}
