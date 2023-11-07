// ai-extension.ts
import * as vscode from 'vscode';
import { AIMarker } from './ai-marker';
import { AIIntegration } from './ai-integration';

export class AIExtension {
    private context: vscode.ExtensionContext;
    private aiMarker: AIMarker;
    private aiIntegration: AIIntegration;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.aiMarker = new AIMarker();
        this.aiIntegration = new AIIntegration(process.env['OPENAI-API-KEY'] || '');
    }

    activate() {
        this.registerCommands();
        this.setupEventListeners();
    }
    
    private registerCommands() {
        const disposable = vscode.commands.registerCommand('greenCoding.start', () => {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                this.aiMarker.markCodeSnippet(editor);
                const markedRanges = this.aiMarker.getMarkedRanges(editor);
                if (markedRanges) {
                    markedRanges.forEach((range) => {
                        const markedCode = editor.document.getText(range);
                        this.aiIntegration.sendToAIForAnalysis(markedCode);
                    });
                }
            }
        });

        this.context.subscriptions.push(disposable);
    }

    private setupEventListeners() {
        vscode.window.onDidChangeTextEditorSelection((e) => {
            const editor = e.textEditor;

            if (editor) {
                const markedRanges = this.aiMarker.getMarkedRanges(editor);
                if (markedRanges) {
                    const selection = editor.selection;

                    // Check if the selection intersects with any marked range
                    const intersectsMarkedRange = markedRanges.some((range) =>
                        range.contains(selection.start) || range.contains(selection.end)
                    );

                    if (!intersectsMarkedRange) {
                        // Remove the decoration and clear the data about the marked code
                        editor.setDecorations(this.aiMarker.decorationType, []);
                        this.aiMarker.clearMarkedRanges(editor);
                    }
                }
            }
        });
    }
}
