import type { Cell } from "./models.js";
import { GridGeometry } from "./GridGeometry.js";
import { GridDataStore } from "./GridDataStore.js";
import { SelectionManager } from "./SelectionManager.js";

/**
 * Everything that ends up on the canvas: cell contents, headers, and the
 * selection/selection-range highlight. Pure rendering - it reads state
 * from the other managers but never mutates it.
 */
export class GridRenderer {
    constructor(
        private readonly ctx: CanvasRenderingContext2D,
        private readonly geometry: GridGeometry,
        private readonly dataStore: GridDataStore,
    ) {}

    public draw(
        viewWidth: number,
        viewHeight: number,
        scrollX: number,
        scrollY: number,
        selection: SelectionManager,
        editingCell: Cell | null,
    ): void {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, viewWidth, viewHeight);

        this.drawVirtualCells(viewWidth, viewHeight, scrollX, scrollY, editingCell);
        this.drawVirtualHeaders(viewWidth, viewHeight, scrollX, scrollY);
        this.drawSelectionHighlight(scrollX, scrollY, selection, editingCell);
    }

    private drawVirtualCells(viewWidth: number, viewHeight: number, scrollX: number, scrollY: number, editingCell: Cell | null): void {
        const { geometry, dataStore, ctx } = this;
        ctx.font = '13px sans-serif';
        ctx.lineWidth = 1;

        const startCol = geometry.getColumnAtX(scrollX);
        const endCol = Math.min(geometry.maxCols - 1, geometry.getColumnAtX(scrollX + viewWidth - geometry.headerWidth));

        const startRow = geometry.getRowAtY(scrollY);
        const endRow = Math.min(geometry.maxRows - 1, geometry.getRowAtY(scrollY + viewHeight - geometry.headerHeight));

        for (let r = startRow; r <= endRow; r++) {
            const cellTopY = geometry.getRowStart(r) - scrollY + geometry.headerHeight;

            for (let c = startCol; c <= endCol; c++) {
                const cellLeftX = geometry.getColumnStart(c) - scrollX + geometry.headerWidth;

                ctx.strokeStyle = '#e0e0e0';
                ctx.strokeRect(cellLeftX, cellTopY, geometry.widthArray[c]!, geometry.heightArray[r]!);

                const textVal = dataStore.getValue(r, c);
                const isBeingEdited = editingCell !== null && editingCell.row === r && editingCell.col === c;

                if (textVal && !isBeingEdited) {
                    ctx.fillStyle = '#1c1c1c';
                    ctx.textAlign = 'left';
                    ctx.fillText(textVal, cellLeftX + 6, cellTopY + 17, geometry.widthArray[c]! - 12);
                }
            }
        }
    }

    private drawSelectionHighlight(scrollX: number, scrollY: number, selection: SelectionManager, editingCell: Cell | null): void {
        if (!selection.selectedCell || editingCell) return;
        const { geometry, ctx } = this;

        // Multi-cell drag range, drawn first so the single-cell outline sits on top of it.
        if (selection.selectionRange && selection.hasRangeSelection()) {
            const { startRow, startColumn, endRow, endColumn } = selection.selectionRange;

            const x1 = geometry.getColumnStart(startColumn) - scrollX + geometry.headerWidth;
            const y1 = geometry.getRowStart(startRow) - scrollY + geometry.headerHeight;
            const x2 = geometry.getColumnStart(endColumn) + geometry.widthArray[endColumn]! - scrollX + geometry.headerWidth;
            const y2 = geometry.getRowStart(endRow) + geometry.heightArray[endRow]! - scrollY + geometry.headerHeight;

            ctx.fillStyle = 'rgba(33,115,70,0.1)';
            ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
            ctx.strokeStyle = '#107c41';
            ctx.lineWidth = 1;
            ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
        }

        const { row, col } = selection.selectedCell;
        const x = geometry.getColumnStart(col) - scrollX + geometry.headerWidth;
        const y = geometry.getRowStart(row) - scrollY + geometry.headerHeight;

        if (x + geometry.widthArray[col]! < geometry.headerWidth || y + geometry.heightArray[row]! < geometry.headerHeight) return;

        ctx.strokeStyle = '#107c41';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, geometry.widthArray[col]!, geometry.heightArray[row]!);
    }

    private drawVirtualHeaders(viewWidth: number, viewHeight: number, scrollX: number, scrollY: number): void {
        const { geometry, ctx } = this;
        ctx.font = '500 11px sans-serif';
        ctx.textAlign = 'center';

        const startCol = geometry.getColumnAtX(scrollX);
        const endCol = Math.min(geometry.maxCols - 1, geometry.getColumnAtX(scrollX + viewWidth - geometry.headerWidth));

        const startRow = geometry.getRowAtY(scrollY);
        const endRow = Math.min(geometry.maxRows - 1, geometry.getRowAtY(scrollY + viewHeight - geometry.headerHeight));

        for (let c = startCol; c <= endCol; c++) {
            const x = geometry.getColumnStart(c) - scrollX + geometry.headerWidth;
            ctx.fillStyle = '#f8f9fa';
            ctx.fillRect(x, 0, geometry.widthArray[c]!, geometry.headerHeight);
            ctx.strokeStyle = '#c0c0c0';
            ctx.strokeRect(x, 0, geometry.widthArray[c]!, geometry.headerHeight);

            ctx.fillStyle = '#444444';
            ctx.fillText(GridGeometry.generateColumnLabel(c), x + (geometry.widthArray[c]! / 2), 19);
        }

        for (let r = startRow; r <= endRow; r++) {
            const y = geometry.getRowStart(r) - scrollY + geometry.headerHeight;
            ctx.fillStyle = '#f8f9fa';
            ctx.fillRect(0, y, geometry.headerWidth, geometry.heightArray[r]!);
            ctx.strokeStyle = '#c0c0c0';
            ctx.strokeRect(0, y, geometry.headerWidth, geometry.heightArray[r]!);
            ctx.fillStyle = '#444444';
            ctx.fillText((r + 1).toString(), geometry.headerWidth / 2, y + 16);
        }

        ctx.fillStyle = '#e8eaed';
        ctx.fillRect(0, 0, geometry.headerWidth, geometry.headerHeight);
        ctx.strokeStyle = '#c0c0c0';
        ctx.strokeRect(0, 0, geometry.headerWidth, geometry.headerHeight);
    }
}
