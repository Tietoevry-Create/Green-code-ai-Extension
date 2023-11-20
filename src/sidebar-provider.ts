import * as vscode from 'vscode';
import { Utils } from 'vscode-uri';
import { AIIntegration } from './ai-integration';
import { TextFormatter } from './text-formatter';

export class SidebarProvider implements vscode.WebviewViewProvider {
    _view?: vscode.WebviewView;
    _doc?: vscode.TextDocument;
    _context: vscode.ExtensionContext;

    constructor(private context: vscode.ExtensionContext) {
        this._context = context;
     }
    
    public resolveWebviewView(webviewView: vscode.WebviewView) {
        this._view = webviewView;

        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,

            localResourceRoots: [this._context.extensionUri],
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Listen for messages from the Sidebar component and execute action
        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case "onFetchText": {
                    // const editor = vscode.window.activeTextEditor;
                    // let aiMarker = new AIMarker();
                    let aiIntegration = new AIIntegration(process.env['OPENAI_API_KEY'] || '', this._context);
                    // let text = ""

                    // if (editor) {
                    //     aiMarker.markCodeSnippet(editor);
                    //     const markedRanges = aiMarker.getMarkedRanges(editor);
                    //     if (markedRanges) {
                    //         markedRanges.forEach(async (range) => {
                    //             const markedCode = editor.document.getText(range);
                    //             text = await aiIntegration.sendToAIForAnalysis(markedCode);
                    //         });
                    //     }
                    // }
                    let editor = vscode.window.activeTextEditor;

                    if (editor === undefined) {
                        vscode.window.showErrorMessage('No active text editor');
                        return;
                    }

                    let text = "";
                    await aiIntegration.sendToAIForAnalysis(editor.document.getText(editor.selection), data.value).then((value) => {text = value});
                    
                    let formattedText = "";
                    formattedText = new TextFormatter(text).formatText();
                    console.log(text + '\n\n' + "----------------" + '\n\n' + formattedText);
                    
                    if (formattedText) {
                        this._view?.webview.postMessage({ type: "onSelectedText", value: formattedText });
                    } else {
                        this._view?.webview.postMessage({ type: "onSelectedText", value: "Failed loading response" });
                    }
                    break;
                }
                case "onInfo": {
                    if (!data.value) {
                        return;
                    }
                    vscode.window.showInformationMessage(data.value);
                    break;
                }
                case "onError": {
                    if (!data.value) {
                        return;
                    }
                    vscode.window.showErrorMessage(data.value);
                    break;
                }
            }
        });

    }

    public revive(panel: vscode.WebviewView) {
        this._view = panel;
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const styleResetUri = webview.asWebviewUri(
            Utils.joinPath(this._context.extensionUri, "media", "reset.css")
        );
        const styleVSCodeUri = webview.asWebviewUri(
            Utils.joinPath(this._context.extensionUri, "media", "vscode.css")
        );
        const scriptUri = webview.asWebviewUri(
            Utils.joinPath(this._context.extensionUri, "src", "compiled/sidebar.js")
        );
        const styleMainUri = webview.asWebviewUri(
            Utils.joinPath(this._context.extensionUri, "src", "compiled/sidebar.css")
        );

        // Use a nonce to only allow a specific script to be run.
        const nonce = getNonce();

        return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
        -->
        <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource
            }; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
                <link href="${styleMainUri}" rel="stylesheet">
                <script nonce="${nonce}">
                    const tsvscode = acquireVsCodeApi();
                </script>

			</head>
            <body>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}