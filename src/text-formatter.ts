// © Tietotevry Corporation (2024)

export class TextFormatter {
  constructor() {}

  public formatText(
    inputText: string,
    highlightColorList: string[]
  ): [string, number[][]] {
    let output = ["<ul>"];
    let lineNumberList: number[][] = [];
    inputText = inputText
      .replaceAll("`", "")
      .replace("json", "")
      .replaceAll("<", "")
      .replaceAll(">", "");
    const jsonObj = JSON.parse(inputText);
    let colorIndex = 0;

    for (const key in jsonObj) {
      if (jsonObj.hasOwnProperty(key) && typeof jsonObj[key] === "object") {
        let line = "";
        let lineNumber = "";
        let lineNumbers: number[] = [];

        for (const iKey in jsonObj[key]) {
          if (jsonObj[key].hasOwnProperty(iKey)) {
            if (iKey == "Line number") {
              lineNumber = jsonObj[key][iKey];
            } else {
              line = "<b>" + iKey + "</b>: " + jsonObj[key][iKey];
            }
          }
        }

        output.push(
          "<li>" +
            line +
            (lineNumber
              ? "<br /><span style='" +
                (highlightColorList.length > 0
                  ? "background-color: " + highlightColorList[colorIndex]
                  : "") +
                "'><b>Line number:</b> " +
                lineNumber +
                "</span>"
              : "") +
            "</li>"
        );

        const ranges = lineNumber.split(",");

        // Process each range
        for (const range of ranges) {
          if (range.includes("-")) {
            const [start, end] = range.split("-").map(Number);

            // Add all numbers in the range to the list
            for (let i = start; i <= end; i++) {
              lineNumbers.push(i);
            }
          } else {
            // Single line number case
            const lineNumber = parseInt(range, 10);
            lineNumbers.push(lineNumber);
          }
        }

        colorIndex = (colorIndex + 1) % highlightColorList.length;
        lineNumberList.push(lineNumbers);
      }
    }

    lineNumberList = this.removeDuplicateElems(lineNumberList);
    output.push("</ul>");
    return [output.join("\n") + "\n", lineNumberList];
  }

  private removeDuplicateElems(array: any[]): any[] {
    return array.sort().filter(function (item, pos, ary) {
      return !pos || item != ary[pos - 1];
    });
  }
}
