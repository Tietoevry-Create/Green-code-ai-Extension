import * as vscode from 'vscode';


function runPythonScript() {
    // Replace this with the path to your Python script
    const pythonScriptPath = '/app.py';

    const terminal = vscode.window.createTerminal('Python Terminal');
    terminal.sendText(`python "${pythonScriptPath}"`);
    terminal.show();
}

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('extension.runPythonScript', runPythonScript);

    context.subscriptions.push(disposable);
}

export function deactivate() {}