import type { ICommand } from "./ICommand.js";
import { ColumnModel } from "../geometry/ColumnModel.js";

export class ResizeColumnCommand implements ICommand {
    constructor(
        private readonly columnModel: ColumnModel,
        private readonly columnIndex: number,
        private readonly oldWidth: number,
        private readonly newWidth: number,
    ) {}

    public execute(): void {
        this.columnModel.setSize(this.columnIndex, this.newWidth);
    }

    public undo(): void {
        this.columnModel.setSize(this.columnIndex, this.oldWidth);
    }
}
