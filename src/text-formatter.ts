export class TextFormatter {
    private _output = "";

    constructor(private readonly _inputText: string) { }

    public formatText():string {
        this.separateParagraphs();
        this.rewriteListInHtml();
        return this._output;
    }

    private separateParagraphs() {
        let lines = this._inputText.split('\n');

        lines.forEach((line) => {
            if (line != '' && line != '\n') {
                this._output += line + '\n';
            }
        })
    }

    private rewriteListInHtml() {
        let output = this._output.split('\n');
        let newOutput: string[] = [];

        if (this.isOrderedList(this._output)) {
            output = ["<ol>"].concat(output);
            output.push("</ol>");
            
            output.forEach((line) => {
                line = line.trim();

                if (this.isOrderedList(line)) {
                    let modifiedLine = this.removeSpecialChar(line.slice(line.indexOf('.')+2,));

                    if (this.isTitledList(modifiedLine)) {
                        let colonIndex = line.indexOf(':');
                        line = "<li>" + "<b>" + line.slice(3, colonIndex+1) + "</b>" + line.slice(colonIndex+1,) + "</li>";
                    }
                    else {
                        line = "<li>" + line.slice(3,) + "</li>";
                    }
                }

                newOutput.push(line);
            })
        }
        else if (this.isUnorderedList(this._output)) {
            output = ["<ul>"].concat(output);
            output.push("</ul>");
            
            output.forEach((line) => {
                line = line.trim();

                if (this.isUnorderedList(line)) {
                    let modifiedLine = this.removeSpecialChar(line.slice(line.indexOf('-')+2,));

                    if (this.isTitledList(modifiedLine)) {
                        let colonIndex = line.indexOf(':');
                        line = "<li>" + "<b>" + line.slice(2, colonIndex+1) + "</b>" + line.slice(colonIndex+1,) + "</li>";
                    }
                    else {
                        line = "<li>" + line.slice(2,) + "</li>";
                    }
                }

                newOutput.push(line);
            })
        }
        else {
            output.forEach((line) => {
                line = line.trim();

                if (this.isTitledList(line)) {
                    let colonIndex = line.indexOf(':');
                    line = "<b>" + line.slice(0, colonIndex+1) + "</b>" + line.slice(colonIndex+1);
                }

                newOutput.push(line);
            })
        }

        this._output = newOutput.join('\n\n');
    }

    private isOrderedList(text: string):boolean {
        const ordredListPattern = /^\d+\.\s+/;
        return ordredListPattern.test(text);
    }

    private isUnorderedList(text: string):boolean {
        const unordredListPattern = /^-\s+/;
        return unordredListPattern.test(text);
    }

    private isTitledList(text: string):boolean {
        // const titledPattern = /^(?:[a-zA-Z]+\s|[a-zA-Z]+)+\:\s+/;
        // return titledPattern.test(text);
        if (text.slice(0, text.length/2).includes(':')) {
            return true;
        }
        return false;
    }

    private removeSpecialChar(text: string):string {
        return text.replaceAll('\'', '').replaceAll('"', '').replaceAll('(', '').replaceAll(')', '')
            .replaceAll('.', '').replaceAll('-', '');
    }

}