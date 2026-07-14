import type { Cell } from "./models.js";
import { GridGeometry } from "./GridGeometry.js";
import { GridDataStore } from "./GridDataStore.js";
import { SelectionManager } from "./SelectionManager.js";
import {
    headerHeight, maxCols, maxRows, headerWidth,
    cellFont, cellTextPaddingX, cellTextBaselineOffset,
    headerFont, columnHeaderTextBaselineOffset, rowHeaderTextBaselineOffset,
    colorGridBackground, colorCellBorder, colorCellText,
    colorHeaderFill, colorHeaderBorder, colorHeaderText,
    colorHeaderSelectedFill, colorHeaderSelectedText,
    colorSelectionRangeFill, colorSelectionBorder, selectionBorderWidth,
    colorActiveCellFill,
} from "./Constants/Constant.js";

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
        this.ctx.fillStyle = colorGridBackground;
        this.ctx.fillRect(0, 0, viewWidth, viewHeight);

        this.drawVirtualCells(viewWidth, viewHeight, scrollX, scrollY, editingCell);
        this.drawSelectionHighlight(scrollX, scrollY, selection, editingCell);
        this.drawVirtualHeaders(viewWidth, viewHeight, scrollX, scrollY, selection);
    }

    private drawVirtualCells(viewWidth: number, viewHeight: number, scrollX: number, scrollY: number, editingCell: Cell | null): void {
        const { geometry, dataStore, ctx } = this;
        ctx.font = cellFont;
        ctx.lineWidth = 1;

        const startCol = geometry.getColumnAtX(scrollX);
        const endCol = Math.min(maxCols - 1, geometry.getColumnAtX(scrollX + viewWidth - headerWidth));

        const startRow = geometry.getRowAtY(scrollY);
        const endRow = Math.min(maxRows - 1, geometry.getRowAtY(scrollY + viewHeight - headerHeight));

        for (let r = startRow; r <= endRow; r++) {
            const cellTopY = geometry.getRowStart(r) - scrollY + headerHeight;

            for (let c = startCol; c <= endCol; c++) {
                const cellLeftX = geometry.getColumnStart(c) - scrollX + headerWidth;

                ctx.strokeStyle = colorCellBorder;
                ctx.strokeRect(cellLeftX, cellTopY, geometry.widthArray[c]!, geometry.heightArray[r]!);

                const textVal = dataStore.getValue(r, c);
                const isBeingEdited = editingCell !== null && editingCell.row === r && editingCell.col === c;

                if (textVal && !isBeingEdited) {
                    ctx.fillStyle = colorCellText;
                    ctx.textAlign = 'left';
                    ctx.fillText(textVal, cellLeftX + cellTextPaddingX, cellTopY + cellTextBaselineOffset, geometry.widthArray[c]! - cellTextPaddingX * 2);
                }
            }
        }
    }

    private drawSelectionHighlight(scrollX: number, scrollY: number, selection: SelectionManager, editingCell: Cell | null): void {
        if (!selection.selectionRange || editingCell) return;
        const { geometry, ctx } = this;

        // Range fill (also used for full row/column/all selections), drawn first so a single-cell
        // active-cell outline can sit on top of it.
        if (selection.hasRangeSelection()) {
            const { startRow, startColumn, endRow, endColumn } = selection.selectionRange;

            const x1 = geometry.getColumnStart(startColumn) - scrollX + headerWidth;
            const y1 = geometry.getRowStart(startRow) - scrollY + headerHeight;
            const x2 = geometry.getColumnStart(endColumn) + geometry.widthArray[endColumn]! - scrollX + headerWidth;
            const y2 = geometry.getRowStart(endRow) + geometry.heightArray[endRow]! - scrollY + headerHeight;

            ctx.fillStyle = colorSelectionRangeFill;
            ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
            ctx.strokeStyle = colorSelectionBorder;
            ctx.lineWidth = selectionBorderWidth;
            ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
        }

        // The distinct "active cell" outline only makes sense for a single-cell anchor; row/column/all
        // selections don't have a real anchor cell (its row or col would be the -1 sentinel).
        if (selection.mode !== 'cell' || !selection.selectedCell) return;

        const { row, col } = selection.selectedCell;
        const x = geometry.getColumnStart(col) - scrollX + headerWidth;
        const y = geometry.getRowStart(row) - scrollY + headerHeight;

        if (x + geometry.widthArray[col]! < headerWidth || y + geometry.heightArray[row]! < headerHeight) return;

        ctx.strokeStyle = colorSelectionBorder;
        ctx.lineWidth = selectionBorderWidth;
        ctx.strokeRect(x, y, geometry.widthArray[col]!, geometry.heightArray[row]!);
        ctx.fillStyle = colorActiveCellFill;
        ctx.fillRect(x, y, geometry.widthArray[col]!, geometry.heightArray[row]!);
    }

    private drawVirtualHeaders(viewWidth: number, viewHeight: number, scrollX: number, scrollY: number, selection: SelectionManager): void {
        const { geometry, ctx } = this;
        ctx.font = headerFont;
        ctx.textAlign = 'center';

        const range = selection.selectionRange;

        const startCol = geometry.getColumnAtX(scrollX);
        const endCol = Math.min(maxCols - 1, geometry.getColumnAtX(scrollX + viewWidth - headerWidth));

        const startRow = geometry.getRowAtY(scrollY);
        const endRow = Math.min(maxRows - 1, geometry.getRowAtY(scrollY + viewHeight - headerHeight));

        for (let c = startCol; c <= endCol; c++) {
            const x = geometry.getColumnStart(c) - scrollX + headerWidth;
            const isSelected = range !== null && c >= range.startColumn && c <= range.endColumn;

            ctx.fillStyle = isSelected ? colorHeaderSelectedFill : colorHeaderFill;
            ctx.fillRect(x, 0, geometry.widthArray[c]!, headerHeight);
            ctx.strokeStyle = colorHeaderBorder;
            ctx.strokeRect(x, 0, geometry.widthArray[c]!, headerHeight);

            ctx.fillStyle = isSelected ? colorHeaderSelectedText : colorHeaderText;
            ctx.fillText(GridGeometry.generateColumnLabel(c), x + (geometry.widthArray[c]! / 2), columnHeaderTextBaselineOffset);
        }

        for (let r = startRow; r <= endRow; r++) {
            const y = geometry.getRowStart(r) - scrollY + headerHeight;
            const isSelected = range !== null && r >= range.startRow && r <= range.endRow;

            ctx.fillStyle = isSelected ? colorHeaderSelectedFill : colorHeaderFill;
            ctx.fillRect(0, y, headerWidth, geometry.heightArray[r]!);
            ctx.strokeStyle = colorHeaderBorder;
            ctx.strokeRect(0, y, headerWidth, geometry.heightArray[r]!);

            ctx.fillStyle = isSelected ? colorHeaderSelectedText : colorHeaderText;
            ctx.fillText((r + 1).toString(), headerWidth / 2, y + rowHeaderTextBaselineOffset);
        }

        // Top-left corner cell ("select all").
        ctx.fillStyle = selection.mode === 'all' ? colorHeaderSelectedFill : colorHeaderFill;
        ctx.fillRect(0, 0, headerWidth, headerHeight);
        ctx.strokeStyle = colorHeaderBorder;
        ctx.strokeRect(0, 0, headerWidth, headerHeight);
    }
}
