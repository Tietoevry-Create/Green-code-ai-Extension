import * as vscode from 'vscode';
import { Utils } from 'vscode-uri';
import { AIIntegration } from './ai-integration';
import { TextFormatter } from './text-formatter';
import { AESEncryption } from './aes-encryption';
import CryptoJS from 'crypto-js';
import { Hashmap } from './hashmap';

export class SidebarProvider implements vscode.WebviewViewProvider {
    _view?: vscode.WebviewView;
    _doc?: vscode.TextDocument;
    _context: vscode.ExtensionContext;
    _errorRetry = 0;

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
                case "onRegister":
                    console.log("running onRegister");
                    // Retrieve data from globalState and send it back to the webview
                    const {azureOpenaiCompletionsDeploymentName, azureOpenaiBaseUrl, openaiApiEncryptionSalt, openaiApiPassword, openaiApiPasswordHash,
                        openaiApiKey, openaiApiPasswordCreatedDate} = data.value;

                    this._context?.globalState.update("azureOpenaiCompletionsDeploymentName", azureOpenaiCompletionsDeploymentName);
                    this._context?.globalState.update("azureOpenaiBaseUrl", azureOpenaiBaseUrl);
                    this._context?.globalState.update("openaiApiEncryptionSalt", openaiApiEncryptionSalt);
                    this._context?.secrets.store("openaiApiPassword", openaiApiPassword);
                    this._context?.secrets.store("openaiApiPasswordHash", openaiApiPasswordHash);
                    this._context?.secrets.store("openaiApiKey", openaiApiKey);
                    if (openaiApiPasswordCreatedDate != 0) {
                        this._context?.globalState.update("openaiApiPasswordCreatedDate", openaiApiPasswordCreatedDate);
                    } else {
                        this._context?.globalState.update("openaiApiPasswordCreatedDate", undefined);
                    }

                    this._view?.webview.postMessage({type: "onRegistered", value: ''});
                    break;
                case "onEdit": {
                    const {azureOpenaiCompletionsDeploymentName, azureOpenaiBaseUrl, unencryptedApiKey, openaiApiPassword, openaiApiPasswordCreatedDate} = data.value;

                    if (openaiApiPassword) {
                        let openaiApiEncryptionSalt: string | undefined = this._context?.globalState.get("openaiApiEncryptionSalt");
                        let openaiApiKey = '';
                        let newKey256Bits = CryptoJS.PBKDF2(openaiApiPassword, openaiApiEncryptionSalt || '', { keySize: 256/32 }).toString();;
                        let openaiApiPasswordHash = new Hashmap(openaiApiPassword).stringHash();
                        
                        if (unencryptedApiKey) {
                            openaiApiKey = new AESEncryption(unencryptedApiKey, newKey256Bits).encrypt();
                        } else {
                            let openaiApiEncryptedKey: string | undefined = '';
                            await this._context?.secrets.get("openaiApiKey").then((key) => {openaiApiEncryptedKey = key});
                            let openaiApiPassword: string | undefined = '';
                            await this._context?.secrets.get("openaiApiPassword").then((password) => {openaiApiPassword = password});

                            let key256Bits = CryptoJS.PBKDF2(openaiApiPassword, openaiApiEncryptionSalt || '', { keySize: 256/32 });
                            let decryptedApiKey = new AESEncryption(openaiApiEncryptedKey || '', key256Bits.toString(CryptoJS.enc.Hex)).decrypt();
                            openaiApiKey = new AESEncryption(decryptedApiKey, newKey256Bits).encrypt();
                        }
                        
                        this._context?.secrets.store("openaiApiKey", openaiApiKey);
                        this._context?.secrets.store("openaiApiPassword", openaiApiPassword);
                        this._context?.secrets.store("openaiApiPasswordHash", openaiApiPasswordHash);
                        
                        if (openaiApiPasswordCreatedDate && openaiApiPasswordCreatedDate != 0) {
                            this._context?.globalState.update("openaiApiPasswordCreatedDate", openaiApiPasswordCreatedDate);
                        } else {
                            this._context?.globalState.update("openaiApiPasswordCreatedDate", undefined);
                        }
                    }
                    else if (unencryptedApiKey) {
                        let openaiApiPassword: string | undefined = '';
                        let openaiApiEncryptionSalt: string | undefined = this._context?.globalState.get("openaiApiEncryptionSalt");
                        await this._context?.secrets.get("openaiApiPassword").then((password) => {openaiApiPassword = password});
                        var key256Bits = CryptoJS.PBKDF2(openaiApiPassword, openaiApiEncryptionSalt!, { keySize: 256/32 }).toString();
                        const openaiApiKey = new AESEncryption(unencryptedApiKey, key256Bits).encrypt();
                        this._context?.secrets.store("openaiApiKey", openaiApiKey);
                    }

                    if (azureOpenaiCompletionsDeploymentName)
                        this._context?.globalState.update("azureOpenaiCompletionsDeploymentName", azureOpenaiCompletionsDeploymentName);
                    if (azureOpenaiBaseUrl)
                        this._context?.globalState.update("azureOpenaiBaseUrl", azureOpenaiBaseUrl);
                    
                    this._view?.webview.postMessage({type: "onEditComplete", value: ''});
                    break;
                }
                case "onCheckApiKey": {
                    console.log("running onCheckApiKey");

                    let openaiApiKey: string | undefined = '';
                    let openaiApiPassword: string | undefined = '';
                    let openaiApiPasswordHash: string | undefined = '';
                    let openaiApiEncryptionSalt: string | undefined = this._context?.globalState.get("openaiApiEncryptionSalt");
                    let openaiApiPasswordCreatedDate: number | undefined = this._context?.globalState.get("openaiApiPasswordCreatedDate");
                    await this._context?.secrets.get("openaiApiKey").then((key) => {openaiApiKey = key});
                    await this._context?.secrets.get("openaiApiPassword").then((password) => {openaiApiPassword = password});
                    await this.context?.secrets.get("openaiApiPasswordHash").then((hash) => {openaiApiPasswordHash = hash});

                    let daysSinceCreated : number;
                    if (openaiApiPasswordCreatedDate) {
                        let currentDate = Date.now();
                        daysSinceCreated = (currentDate - openaiApiPasswordCreatedDate)/86400000;
                    } else {
                        daysSinceCreated = 0;
                    }

                    console.log(daysSinceCreated);

                    if (openaiApiKey && openaiApiEncryptionSalt && openaiApiPasswordHash) {
                        this._view?.webview.postMessage({ type: "onApiKeyExists", value: [openaiApiPassword ? true : false, daysSinceCreated]});
                        console.log("API key exists");
                    }
                    else {
                        this._view?.webview.postMessage({ type: "onApiKeyNotFound", value: '' });
                        console.log("API key not found");
                    }
                    break;
                }
                case "onCheckPassword": {
                    console.log("running onCheckPassword");

                    let openaiApiEncryptionSalt: string | undefined = this._context?.globalState.get("openaiApiEncryptionSalt");
                    let openaiApiPasswordHash: string | undefined = '';
                    await this.context?.secrets.get("openaiApiPasswordHash").then((hash) => {openaiApiPasswordHash = hash});

                    if (!openaiApiEncryptionSalt || !openaiApiPasswordHash) { 
                        console.log("Corrupted data")
                        break; 
                    }

                    if (openaiApiPasswordHash == data.value) {
                        this._view?.webview.postMessage({ type: "onCorrectPassword", value: '' });
                    }
                    else {
                        this._view?.webview.postMessage({ type: "onIncorrectPassword", value: '' });
                    }
                    break;
                }
                case "onFetchSavedData": {
                    console.log("running onFetchSavedData");

                    let openaiApiPassword: string | undefined = '';
                    await this.context?.secrets.get("openaiApiPassword").then((password) => {openaiApiPassword = password});
                    this._view?.webview.postMessage({ type: "onDataFetched", value: 
                        [
                            this._context?.globalState.get("azureOpenaiCompletionsDeploymentName") || '',
                            this.context?.globalState.get("azureOpenaiBaseUrl") || '',
                            openaiApiPassword
                        ]
                    });
                    break;
                }
                case "onClearData": {
                    console.log("running onClearData");

                    this._context?.globalState.update("azureOpenaiCompletionsDeploymentName", undefined);
                    this.context?.globalState.update("azureOpenaiBaseUrl", undefined);
                    this._context?.secrets.delete("openaiApiKey");
                    this.context?.globalState.update("openaiApiEncryptionSalt", undefined);
                    this.context?.secrets.delete("openaiApiPasswordHash");
                    this.context?.secrets.delete("openaiApiPassword");
                    this._context?.globalState.update("openaiApiPasswordCreatedDate", undefined);

                    this._view?.webview.postMessage({type: "onClearedData", value: ''});
                    break;
                }
                case "onFetchText": {
                    console.log("running onFetchText");

                    let azureOpenaiCompletionsDeploymentName: string | undefined = this.context?.globalState.get("azureOpenaiCompletionsDeploymentName");
                    let azureOpenaiBaseUrl: string | undefined = this.context?.globalState.get("azureOpenaiBaseUrl");
                    let openaiApiEncryptionSalt: string | undefined = this._context?.globalState.get("openaiApiEncryptionSalt");
                    let openaiApiEncryptedKey: string | undefined = '';
                    let openaiApiPassword: string | undefined = '';
                    await this._context?.secrets.get("openaiApiKey").then((key) => {openaiApiEncryptedKey = key});
                    await this._context?.secrets.get("openaiApiPassword").then((password) => {openaiApiPassword = password});
                    
                    let key256Bits = CryptoJS.PBKDF2(openaiApiPassword, openaiApiEncryptionSalt || '', { keySize: 256/32 });
                    let apiKey = new AESEncryption(openaiApiEncryptedKey || '', key256Bits.toString(CryptoJS.enc.Hex)).decrypt();
                    let aiIntegration = new AIIntegration(azureOpenaiCompletionsDeploymentName || '', azureOpenaiBaseUrl || '', 
                    apiKey || '', this._context);
                    let editor = vscode.window.activeTextEditor;

                    if (editor === undefined) {
                        vscode.window.showErrorMessage('No active text editor');
                        return;
                    }

                    let text = "";
                    try {
                        await aiIntegration.sendToAIForAnalysis(editor.document.getText(editor.selection), editor.selection.start.line, data.value).then((value) => {text = value});
                    } catch(error) {
                        console.log(error);
                        this._view?.webview.postMessage({ type: "onError", value: error });
                        break;
                    }
                    
                    let formattedText = '';
                    try {
                        formattedText = new TextFormatter().formatText(text);
                    } catch (error) {
                        if (this._errorRetry < 2) {
                            this._view?.webview.postMessage({type: "onRegenResponse", value: ''})
                            this._errorRetry++;
                        } else {
                            this._errorRetry = 0;
                            console.log(text, '\n');
                            console.log(error);
                            this._view?.webview.postMessage({type: "onError", value: "ChatGPT provided Invalid JSON format!\nNote: GPT-3.5-Turbo versions other than 1106 are not supported."});
                        }
                        break;
                    }
                    console.log(text + '\n\n' + "----------------" + '\n\n' + formattedText);
                    
                    if (formattedText) {
                        this._view?.webview.postMessage({ type: "onSelectedText", value: formattedText });
                    } else {
                        this._view?.webview.postMessage({ type: "onSelectedText", value: "Failed loading response" });
                    }
                    break;
                }
                case "onInfo": {
                    console.log("running onInfo");

                    if (!data.value) {
                        return;
                    }
                    vscode.window.showInformationMessage(data.value);
                    break;
                }
                case "onError": {
                    console.log("running onError");

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