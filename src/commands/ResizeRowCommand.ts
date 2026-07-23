import type { ICommand } from "./ICommand.js";
import { RowModel } from "../geometry/RowModel.js";

export class ResizeRowCommand implements ICommand {
    constructor(
        private readonly rowModel: RowModel,
        private readonly rowIndex: number,
        private readonly oldHeight: number,
        private readonly newHeight: number,
    ) {}

    public execute(): void {
        this.rowModel.setSize(this.rowIndex, this.newHeight);
    }

    public undo(): void {
        this.rowModel.setSize(this.rowIndex, this.oldHeight);
    }
}
