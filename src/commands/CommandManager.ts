import type { ICommand } from "./ICommand.js";
import { maxHistorySize } from "../Constants/Constant.js";


export class CommandManager {
    private undoStack: ICommand[] = [];
    private redoStack: ICommand[] = [];

    /** Runs a brand-new command and records it for undo. Clears the redo branch. */
    public executeCommand(command: ICommand): void {
        
        command.execute();
        this.registerExecuted(command);
    }

    
    public registerExecuted(command: ICommand): void {
        console.log(command,"hi")
        this.undoStack.push(command);
        if (this.undoStack.length > maxHistorySize) {
            this.undoStack.shift();
        }
        this.redoStack = [];
    }

    public undo(): void {
        const command = this.undoStack.pop();
        if (!command) return;
        command.undo();
        this.redoStack.push(command);
    }

    public redo(): void {
        const command = this.redoStack.pop();
        if (!command) return;
        command.execute();
        this.undoStack.push(command);
    }

    public clear(): void {
        this.undoStack = [];
        this.redoStack = [];
    }
}
