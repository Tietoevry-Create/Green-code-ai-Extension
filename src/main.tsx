import * as vscode from 'vscode';
import * as extension from './ai-extension';

export function activate(context: vscode.ExtensionContext) {
  extension.activate(context);
}

  // context.globalState.update("openaiApiKey", undefined);
  // context.globalState.update("openaiApiPassword", undefined);
  // context.globalState.update("openaiApiEncryptionSalt", undefined);
  // console.log("Cleared context.")