
import * as vscode from 'vscode';
import { AIExtension } from './ai-extension';

export function activate(context: vscode.ExtensionContext) {
  const aiExtension = new AIExtension(context);
  aiExtension.activate()
}
