// ai-marker.ts
import * as vscode from 'vscode';

export class AIMarker {
    public decorationType: vscode.TextEditorDecorationType;
    private markedCodeSnippets: Map<vscode.TextEditor, vscode.Range[]>;

    constructor() {
        this.decorationType = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(255, 255, 0, 0.5)',
        });
        this.markedCodeSnippets = new Map();
    }

    public markCodeSnippet(editor: vscode.TextEditor) {
        const selection = editor.selection;
        const range = new vscode.Range(selection.start, selection.end);

        editor.setDecorations(this.decorationType, [range]);

        if (editor) {
            if (this.markedCodeSnippets.has(editor)) {
                this.markedCodeSnippets.get(editor)!.push(range);
            } else {
                this.markedCodeSnippets.set(editor, [range]);
            }
        }
    }

    public getMarkedRanges(editor: vscode.TextEditor) {
        return this.markedCodeSnippets.get(editor);
    }

    public clearMarkedRanges(editor: vscode.TextEditor) {
        this.markedCodeSnippets.delete(editor);
    }
}
