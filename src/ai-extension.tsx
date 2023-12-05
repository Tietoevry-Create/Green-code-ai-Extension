// ai-extension.ts
import * as vscode from 'vscode';
import { SidebarProvider } from './sidebar-provider.js';

export function activate(context: vscode.ExtensionContext) {

	// Register the Sidebar Panel
	const sidebarProvider = new SidebarProvider(context);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            "green-code-ai-sidebar",
            sidebarProvider
        )
    );

	// Register a custom command
	// context.subscriptions.push(vscode.commands.registerCommand('greenCoding.start', () => {
        
    // }));

}

// this method is called when your extension is deactivated
export function deactivate() { }