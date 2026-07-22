import type { Cell } from "../models/Types.js";
import { GridGeometry } from "../geometry/GridGeometry.js";
import { GridDataStore } from "../data/GridDataStore.js";
import { SelectionManager } from "../selection/SelectionManager.js";
import type { VisibleRange } from "../viewport/ViewportManager.js";
import { ColumnModel } from "../geometry/ColumnModel.js";
import { CellSelectionController } from "../selection/CellSelectionController.js";
import { ColumnSelectionController } from "../selection/ColumnSelectionController.js";
import { RowSelectionController } from "../selection/RowSelectionController.js";
import { AllSelectionController } from "../selection/AllSelectionController.js";
import {
    headerHeight, headerWidth,
    cellFont, cellTextPaddingX, cellTextBaselineOffset,
    headerFont, columnHeaderTextBaselineOffset, rowHeaderTextBaselineOffset,
    colorGridBackground, colorCellBorder, colorCellText,
    colorHeaderFill, colorHeaderBorder, colorHeaderText,
    colorHeaderSelectedFill, colorHeaderSelectedText,
    colorSelectionRangeFill, colorSelectionBorder, selectionBorderWidth,
    colorActiveCellFill,
} from "../Constants/Constant.js";
import type { RowResizeController } from "../resizing/RowResizeController.js";

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
        visibleRange: VisibleRange,
        selection: SelectionManager,
        editingCell: Cell | null,
    ): void {
        // this.ctx.fillStyle = colorGridBackground;
        this.ctx.clearRect(0, 0, viewWidth, viewHeight);

        this.drawVisibleCells(scrollX, scrollY, visibleRange, editingCell);
        this.drawSelectionHighlight(scrollX, scrollY, selection, editingCell);
        this.drawVisibleHeaders(scrollX, scrollY, visibleRange, selection);
    }

    private drawVisibleCells(scrollX: number, scrollY: number, range: VisibleRange, editingCell: Cell | null): void {
        const { geometry, dataStore, ctx } = this;
        ctx.font = cellFont;
        ctx.lineWidth = 1;

        for (let r = range.startRow; r <= range.endRow; r++) {
            const cellTopY = geometry.rows.getStart(r) - scrollY + headerHeight;
            const rowHeight = geometry.rows.getSize(r);

            for (let c = range.startCol; c <= range.endCol; c++) {
                const cellLeftX = geometry.columns.getStart(c) - scrollX + headerWidth;
                const colWidth = geometry.columns.getSize(c);

                ctx.strokeStyle = colorCellBorder;
                ctx.strokeRect(cellLeftX, cellTopY, colWidth, rowHeight);

                const textVal = dataStore.getValue(r, c);
                const isBeingEdited = editingCell !== null && editingCell.row === r && editingCell.col === c;

                if (textVal && !isBeingEdited) {
                    ctx.fillStyle = colorCellText;
                    ctx.textAlign = 'left';
                    ctx.fillText(textVal, cellLeftX + cellTextPaddingX, cellTopY + cellTextBaselineOffset, colWidth - cellTextPaddingX * 2);
                }
            }
        }
    }

    private drawSelectionHighlight(scrollX: number, scrollY: number, selection: SelectionManager, editingCell: Cell | null): void {
        if (!selection?.selectionRange || editingCell) return;
        const { geometry, ctx } = this;

        if (selection.hasRangeSelection()) {
            const { startRow, startColumn, endRow, endColumn } = selection.selectionRange;

            const x1 = geometry.columns.getStart(startColumn) - scrollX + headerWidth;
            const y1 = geometry.rows.getStart(startRow) - scrollY + headerHeight;
            const x2 = geometry.columns.getStart(endColumn) + geometry.columns.getSize(endColumn) - scrollX + headerWidth;
            const y2 = geometry.rows.getStart(endRow) + geometry.rows.getSize(endRow) - scrollY + headerHeight;

            ctx.fillStyle = colorSelectionRangeFill;
            ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
            ctx.strokeStyle = colorSelectionBorder;
            ctx.lineWidth = selectionBorderWidth;
            ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
        }

        if (selection.mode !== 'cell' || !selection.selectedCell) return;

        const { row, col } = selection.selectedCell;
        const x = geometry.columns.getStart(col) - scrollX + headerWidth;
        const y = geometry.rows.getStart(row) - scrollY + headerHeight;
        const width = geometry.columns.getSize(col);
        const height = geometry.rows.getSize(row);

        if (x + width < headerWidth || y + height < headerHeight) return;

        ctx.strokeStyle = colorSelectionBorder;
        ctx.lineWidth = selectionBorderWidth;
        ctx.strokeRect(x, y, width, height);
        ctx.fillStyle = colorActiveCellFill;
        ctx.fillRect(x, y, width, height);
    }

    private drawVisibleHeaders(scrollX: number, scrollY: number, range: VisibleRange, selection: SelectionManager): void {
        const { geometry, ctx } = this;
        ctx.font = headerFont;
        ctx.textAlign = 'center';

        const selRange = selection?selection.selectionRange:null;

        for (let c = range.startCol; c <= range.endCol; c++) {
            const x = geometry.columns.getStart(c) - scrollX + headerWidth;
            const width = geometry.columns.getSize(c);
            const isSelected = selRange !== null && c >= selRange.startColumn && c <= selRange.endColumn;

            ctx.fillStyle = isSelected ? colorHeaderSelectedFill : colorHeaderFill;
            ctx.fillRect(x, 0, width, headerHeight);
            ctx.strokeStyle = colorHeaderBorder;
            ctx.strokeRect(x, 0, width, headerHeight);

            ctx.fillStyle = isSelected ? colorHeaderSelectedText : colorHeaderText;
            ctx.fillText(ColumnModel.generateColumnLabel(c), x + (width / 2), columnHeaderTextBaselineOffset);
        }

        for (let r = range.startRow; r <= range.endRow; r++) {
            const y = geometry.rows.getStart(r) - scrollY + headerHeight;
            const height = geometry.rows.getSize(r);
            const isSelected = selRange !== null && r >= selRange.startRow && r <= selRange.endRow;

            ctx.fillStyle = isSelected ? colorHeaderSelectedFill : colorHeaderFill;
            ctx.fillRect(0, y, headerWidth, height);
            ctx.strokeStyle = colorHeaderBorder;
            ctx.strokeRect(0, y, headerWidth, height);

            ctx.fillStyle = isSelected ? colorHeaderSelectedText : colorHeaderText;
            ctx.fillText((r + 1).toString(), headerWidth / 2, y + rowHeaderTextBaselineOffset);
        }

        ctx.fillStyle = selection?.mode === 'all' ? colorHeaderSelectedFill : colorHeaderFill;
        ctx.fillRect(0, 0, headerWidth, headerHeight);
        ctx.strokeStyle = colorHeaderBorder;
        ctx.strokeRect(0, 0, headerWidth, headerHeight);
    }
}
