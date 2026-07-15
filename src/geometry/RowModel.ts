import { AxisModel } from "./AxisModel.js";

export class RowModel extends AxisModel {
    constructor(rowCount: number, defaultHeight: number, minHeight: number) {
        super(rowCount, defaultHeight, minHeight);
    }
}
