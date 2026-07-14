import type { EditAction } from "./models.js";
import { maxHistorySize } from "./Constants/Constant.js";

export type ActionApplier = (action: EditAction, isUndo: boolean) => void;


export class HistoryManager {
    private undoStack: EditAction[] = [];
    private redoStack: EditAction[] = [];

    constructor(private readonly applyAction: ActionApplier) {}

    public push(action: EditAction): void {
        this.undoStack.push(action);
        if (this.undoStack.length > maxHistorySize) {
            this.undoStack.shift();
        }
        this.redoStack = []; // any new action invalidates the redo branch
    }

    public undo(): void {
        const action = this.undoStack.pop();
        if (!action) return;
        this.applyAction(action, true);
        this.redoStack.push(action);
    }

    public redo(): void {
        const action = this.redoStack.pop();
        if (!action) return;
        this.applyAction(action, false);
        this.undoStack.push(action);
    }

    public clear(): void {
        this.undoStack = [];
        this.redoStack = [];
    }
}
