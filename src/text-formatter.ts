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
            let listOngoing = false;
            
            output.forEach((line) => {
                let newline: string = line.trim();

                if (this.isOrderedList(newline)) {
                    if (this.isTitledList(newline)) {
                        let colonIndex = newline.indexOf(':');
                        newline = "<li>" + "<b>" + newline.slice(3, colonIndex+1) + "</b>" + newline.slice(colonIndex+1,) + "</li>";
                    }
                    else {
                        newline = "<li>" + newline.slice(3,) + "</li>";
                    }
                    if (!listOngoing) {
                        listOngoing = true;
                        newline = "<ol>" + newline;
                    }
                }
                else if (newline == '' || newline == '\n') {
                    return;
                }
                else if (listOngoing) {
                    listOngoing = false;
                    newline = "</ol>" + newline;
                }

                newOutput.push(newline);
            })

            newOutput.push("</ol>");
        }
        else if (this.isUnorderedList(this._output)) {
            let listOngoing = false;
            
            output.forEach((line) => {
                let newline: string = line.trim();

                if (this.isUnorderedList(newline)) {
                    if (this.isTitledList(newline)) {
                        let colonIndex = newline.indexOf(':');
                        newline = "<li>" + "<b>" + newline.slice(2, colonIndex+1) + "</b>" + newline.slice(colonIndex+1,) + "</li>";
                    }
                    else {
                        newline = "<li>" + newline.slice(2,) + "</li>";
                    }
                    if (!listOngoing) {
                        listOngoing = true;
                        newline = "<ul>" + newline;
                    }
                }
                else if (newline == '' || newline == '\n') {
                    return;
                }
                else if (listOngoing) {
                    listOngoing = false;
                    newline = "</ul>" + newline;
                }

                newOutput.push(newline);
            })

            newOutput.push("</ul>");
        }
        else {
            output.forEach((line) => {
                let newline: string = line.trim();

                if (this.isTitledList(newline)) {
                    let colonIndex = newline.indexOf(':');
                    newline = "<b>" + newline.slice(0, colonIndex+1) + "</b>" + newline.slice(colonIndex+1);
                }

                newOutput.push(newline);
            })
        }

        this._output = newOutput.join('\n\n');
    }

    private isOrderedList(text: string):boolean {
        const ordredListPattern = /\d+\.\s+/;
        return ordredListPattern.test(text);
    }

    private isUnorderedList(text: string):boolean {
        const unordredListPattern = /-\s+/;
        return unordredListPattern.test(text);
    }

    private isTitledList(text: string):boolean {
        if (text.slice(0, text.length/2).includes(':')) {
            return true;
        }
        return false;
    }

}