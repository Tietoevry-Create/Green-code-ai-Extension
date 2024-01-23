import * as vscode from 'vscode';
import * as extension from './ai-extension';

export function activate(context: vscode.ExtensionContext) {
  extension.activate(context);
}