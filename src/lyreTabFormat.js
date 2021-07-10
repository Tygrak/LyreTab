function createTabString(bpm, noteTrack, width=30) {
    let resultString = "";
    resultString += "bpm:" + bpm + "\n";
    let maxHeight = 0;
    for (let i = 0; i < noteTrack.length; i++) {
        if (noteTrack[i].length > maxHeight) {
            maxHeight = noteTrack[i].length;
        }
    }
    for (let line = 0; line < maxHeight; line++) {
        for (let i = 0; i < noteTrack.length; i++) {
            if (noteTrack[i].length <= line) {
                resultString += "  ";
            } else {
                resultString += noteTrack[i][line];
            }
            resultString += "|";
        }
        resultString += "\n";
    }
    return resultString;
}

function loadTabString(string) {
    let lines = string.split("\n");
    let match = lines[0].match(/bpm: *(\d+)/);
    let noteTrack = [];
    return {bpm: match.groups[1], noteTrack: noteTrack};
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

export {createTabString, loadTabString, createDownload};