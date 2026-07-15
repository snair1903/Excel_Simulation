import { AxisModel } from "./AxisModel.js";

export class ColumnModel extends AxisModel {
    constructor(columnCount: number, defaultWidth: number, minWidth: number) {
        super(columnCount, defaultWidth, minWidth);
    }

    public static generateColumnLabel(index: number): string {
        let label = '';
        let temp = index;
        while (temp >= 0) {
            label = String.fromCharCode((temp % 26) + 65) + label;
            temp = Math.floor(temp / 26) - 1;
        }
        return label;
    }
}
