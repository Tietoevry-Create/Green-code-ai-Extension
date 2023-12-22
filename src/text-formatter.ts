export class TextFormatter {

    constructor() { }

    public formatText(inputText: string):string {
        let output = ["<ul>"];
        inputText = inputText.replaceAll('`', '').replace('json', '');
        const jsonObj = JSON.parse(inputText);

        for (const key in jsonObj) {
            if (jsonObj.hasOwnProperty(key)) {
                let value = this.formatValue(jsonObj[key]);
                let body = '';

                if (key == "pointers") {
                    body = value;
                } else {
                    let title = "<b>" + key + "</b>";
                    body = "<li>" + title + ': ' + value + "</li>";
                }

                output.push(body);
            }
        }

        output.push("</ul>")
        return output.join('\n') + '\n';
    }

    private formatValue(value: any): string {
        if (Array.isArray(value)) {
            // Check if the array contains objects (key-value dictionaries)
            if (value.length > 0 && typeof value[0] === 'object') {
                // Format each object as a separate list item
                let subList = value.map(obj => {
                    return "<li>" + this.formatText(JSON.stringify(obj)) + "</li>";
                }).join('');
                return "<ul>" + subList + "</ul>";
            } else {
                // Format the array normally
                return "<ul>" + value.map(item => "<li>" + this.formatValue(item) + "</li>").join('') + "</ul>";
            }
        } else if (typeof value === 'object') {
            return this.formatText(JSON.stringify(value));
        } else {
            return value;
        }
    }
}