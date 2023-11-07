// ai-extension.ts
import * as vscode from 'vscode';
import { SidebarProvider } from './sidebar-provider';

export function activate(context: vscode.ExtensionContext) {

	// Register the Sidebar Panel
	const sidebarProvider = new SidebarProvider(context.extensionUri);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            "green-code-ai-sidebar",
            sidebarProvider
        )
    );

	// Register a custom command
	context.subscriptions.push(vscode.commands.registerCommand('greenCoding.start', () => {
        
    }));

}

// this method is called when your extension is deactivated
export function deactivate() { }

// export class AIExtension {
//     private context: vscode.ExtensionContext;
//     private aiMarker: AIMarker;
//     private aiIntegration: AIIntegration;

//     constructor(context: vscode.ExtensionContext) {
//         this.context = context;
//         this.aiMarker = new AIMarker();
//         this.aiIntegration = new AIIntegration(process.env['OPENAI_API_KEY'] || '');
//     }

//     private panel: vscode.WebviewPanel | undefined;

//     activate() {
//         this.registerCommands();
//         this.setupEventListeners();
        
//         const reviewView = vscode.window.registerWebviewViewProvider(
//             'greenCoding.reviewView',
//             new SidebarProvider(this.context.extensionUri)
//           );
//     }

//     private registerCommands() {
//         const disposable = vscode.commands.registerCommand('greenCoding.start', () => {
//             const editor = vscode.window.activeTextEditor;
//             if (editor) {
//                 this.aiMarker.markCodeSnippet(editor);
//                 const markedRanges = this.aiMarker.getMarkedRanges(editor);
//                 if (markedRanges) {
//                     markedRanges.forEach((range) => {
//                         const markedCode = editor.document.getText(range);
//                         this.aiIntegration.sendToAIForAnalysis(markedCode);
//                     });
//                 }
//             }
//             if (!this.panel) {
//                 this.panel = vscode.window.createWebviewPanel(
//                     'aiReview',
//                     'AI Code Review',
//                     vscode.ViewColumn.One,
//                     {
//                         enableScripts: true,
//                     }
//                 );

//                 this.panel.webview.html = this.getWebviewContent();
//             } else {
//                 this.panel?.reveal(vscode.ViewColumn.One);
//             }
//         });

//         this.context.subscriptions.push(disposable);
//     }

//     private getWebviewContent() {
//         const aiReviewHtmlPath = vscode.Uri.file(
//             this.context.asAbsolutePath('../aiReview.html')
//         );
//         const aiReviewHtml = aiReviewHtmlPath.with({ scheme: 'vscode-resource' });
//         return `<iframe src="${aiReviewHtml}" width="100%" height="100%"></iframe>`;
//     }

//     private setupEventListeners() {
//         vscode.window.onDidChangeTextEditorSelection((e) => {
//             const editor = e.textEditor;

//             if (editor) {
//                 const markedRanges = this.aiMarker.getMarkedRanges(editor);
//                 if (markedRanges) {
//                     const selection = editor.selection;

//                     // Check if the selection intersects with any marked range
//                     const intersectsMarkedRange = markedRanges.some((range) =>
//                         range.contains(selection.start) || range.contains(selection.end)
//                     );

//                     if (!intersectsMarkedRange) {
//                         // Remove the decoration and clear the data about the marked code
//                         editor.setDecorations(this.aiMarker.decorationType, []);
//                         this.aiMarker.clearMarkedRanges(editor);
//                     }
//                 }
//             }
//         });
//     }

//     public GetPanel() {
//         return this.panel;
//     }
// }
