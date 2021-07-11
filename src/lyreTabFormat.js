function createTabString(bpm, noteTrack, width=24) {
    let resultString = "";
    resultString += "bpm:" + bpm + "\n";
    let split = splitArrayIntoChunks(noteTrack, width);
    for (let chunkI = 0; chunkI < split.length; chunkI++) {
        let maxHeight = 0;
        for (let i = 0; i < noteTrack.length; i++) {
            if (noteTrack[i].length > maxHeight) {
                maxHeight = noteTrack[i].length;
            }
        }
        let chunk = split[chunkI];
        for (let line = 0; line < maxHeight; line++) {
            for (let i = 0; i < chunk.length; i++) {
                if (chunk[i].length <= line) {
                    resultString += "  ";
                } else {
                    resultString += chunk[i][line];
                }
                resultString += "|";
            }
            resultString += "\n";
        }
        resultString += "\n\n";
    }
    return resultString;
}

function loadFile(file, callback) {
    if (file == null) {
        throw "No data file provided.";
    }
    let reader = new FileReader();
    reader.onload = function (textResult) {
        callback(textResult.target.result);
    }
    reader.onerror = function (e) {
        throw "Loading the data file failed, most likely because of how big the file is.";
    }
    reader.readAsText(file, "UTF-8");
}

function loadTabString(tabString) {
    let lines = tabString.split("\n");
    let match = lines[0].match(/bpm: *(\d+)/);
    let noteTrack = [];
    let currentPos = 0;
    for (let line = 1; line < lines.length; line++) {
        if (lines[line] == "") {
            continue;
        }
        let height = 0;
        for (let i = line; i < lines.length; i++) {
            if (lines[i] == "") {
                break;
            }
            height++;
            let split = lines[i].split("|");
            for (let j = 0; j < split.length; j++) {
                if (split[j] == "") {
                    continue;
                }
                if (j+currentPos >= noteTrack.length) {
                    noteTrack.push([]);
                }
                if (split[j] != "  ") {
                    noteTrack[j+currentPos].push(split[j]);
                }
            }
        }
        currentPos = noteTrack.length;
        line += height;
    }
    return {bpm: match[1], noteTrack: noteTrack};
}

function createDownload(data, filename) {
    let file = new Blob([data], {type: "text/plain"});
    if (window.navigator.msSaveOrOpenBlob) { // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    } else { // Others
        let a = document.createElement("a");
        let url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);  
        }, 0); 
    }
}

function splitArrayIntoChunks(array, chunkSize) {
    let result = [];
    let current = [];
    let n = 0;
    for (let i = 0; i < array.length; i++) {
        current.push(array[i]);
        n++;
        if (n >= chunkSize) {
            result.push(current);
            current = [];
            n = 0;
        }
    }
    if (n > 0) {
        result.push(current);
    }
    return result;
}

export {createTabString, loadTabString, createDownload, loadFile};