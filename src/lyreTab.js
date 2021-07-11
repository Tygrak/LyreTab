import * as TabCreator from './lyreTabFormat.js';

let bpm = 100;

const noteTrackElement = document.getElementById("noteTrack");
const lyreDivElement = document.getElementById("lyre-instrument");
const startPlayingButton = document.getElementById("startPlaying");
const stopPlayingButton = document.getElementById("stopPlaying");
const bpmInput = document.getElementById("bpm");
const trackLengthInput = document.getElementById("trackLength");
const changeTrackLengthButton = document.getElementById("changeTrackLength");
const remakeTrackButton = document.getElementById("remakeTrack");
const saveTrackButton = document.getElementById("saveTrack");
const trackFileInput = document.getElementById("trackFileInput");
const loadTrackButton = document.getElementById("loadTrack");

changeTrackLengthButton.onclick = resizeNoteTrack;
remakeTrackButton.onclick = makeNoteTrack;
startPlayingButton.onclick = startPlaying;
stopPlayingButton.onclick = stopPlaying;
saveTrackButton.onclick = () => {
    let trackString = TabCreator.createTabString(bpm, noteTrack);
    console.log(trackString);
    TabCreator.createDownload(trackString, "track.ltab");
};
loadTrackButton.onclick = () => {
    TabCreator.loadFile(trackFileInput.files[0], (result) => {
        let loaded = TabCreator.loadTabString(result);
        bpmInput.value = loaded.bpm;
        bpm = loaded.bpm;
        noteTrack = loaded.noteTrack;
        trackLengthInput.value = loaded.noteTrack.length;
        resizeNoteTrack();
    });
};

document.onkeydown = keyPressed;

// todo: add settings page switchable with a button

const synth = new Tone.PolySynth(Tone.Synth).toDestination();
let allowedNoteKeys = ["A","B","C","D","E","F","G"];
let allowedNoteNums = ["3","4","5"];
let allowedNotes = ["G3","A3","B3","C4","D4","E4","F4","G4","A4","B4","C5","D5","E5","F5","G5","A5"];

let noteTrack = [];
let noteTrackSlots = [];
let selected = [];
let copied = [];
let currentNote = 0;
let lastPlayingNoteTrackSlot = null;
let composedNote = "";
let addingNote = false;

makeNoteTrack();
hookupLyreButtons();
defaultTrack();

function defaultTrack() {
    noteTrack[0] = ["C4"];
    noteTrack[1] = ["B4"];
    noteTrack[2] = ["D4"];
    noteTrack[3] = ["C4"];
    updateUITrackNotes();
}

function updateUITrackNotes() {
    for (let i = 0; i < noteTrack.length; i++) {
        if (noteTrack[i].length == 0) {
            noteTrackSlots[i].childNodes[1].innerText = "x";
            continue;
        }
        let noteText = "";
        for (let j = 0; j < noteTrack[i].length; j++) {
            noteText += noteTrack[i][j];
            if (j < noteTrack[i].length-1) {
                noteText += "\n";
            }
        }
        noteTrackSlots[i].childNodes[1].innerText = noteText;
    }
}

function resizeNoteTrack() {
    let newTrackLength = parseInt(trackLengthInput.value);
    while (noteTrack.length < newTrackLength) {
        noteTrack.push([]);
    }
    noteTrack.length = newTrackLength;
    noteTrackSlots = [];
    noteTrackElement.innerHTML = "";
    for (let i = 0; i < noteTrack.length; i++) {
        let element = document.createElement("span");
        element.classList.add("noteTrack-slot");
        let label = document.createElement("span");
        label.classList.add("noteTrack-label");
        label.innerText = i+1;
        element.appendChild(label);
        let value = document.createElement("span");
        value.classList.add("noteTrack-value");
        value.innerText = "x";
        element.appendChild(value);
        element.onclick = (event) => {
            noteTrackOnClick(i, event);
        };
        noteTrackElement.appendChild(element);
        noteTrackSlots.push(element);
    }
    updateUITrackNotes();
}

function makeNoteTrack() {
    let trackLength = parseInt(trackLengthInput.value);
    noteTrack = [];
    noteTrackSlots = [];
    noteTrackElement.innerHTML = "";
    for (let i = 0; i < trackLength; i++) {
        let element = document.createElement("span");
        element.classList.add("noteTrack-slot");
        let label = document.createElement("span");
        label.classList.add("noteTrack-label");
        label.innerText = i+1;
        element.appendChild(label);
        let value = document.createElement("span");
        value.classList.add("noteTrack-value");
        value.innerText = "x";
        element.appendChild(value);
        element.onclick = (event) => {
            noteTrackOnClick(i, event);
        };
        noteTrackElement.appendChild(element);
        noteTrackSlots.push(element);
        noteTrack.push([]);
    }
}

function noteTrackOnClick(position, event) {
    if (event.shiftKey && selected.length != 0) {
        for (let i = 0; i < selected.length; i++) {
            noteTrackSlots[selected[i]].classList.remove("noteTrack-selected");
        }
        let startSelected = selected[0];
        let from = Math.min(startSelected, position);
        let to = Math.max(startSelected, position)+1;
        selected = [];
        for (let i = from; i < to; i++) {
            selected.push(i);
            noteTrackSlots[i].classList.add("noteTrack-selected");
        }
    } else {
        for (let i = 0; i < selected.length; i++) {
            noteTrackSlots[selected[i]].classList.remove("noteTrack-selected");
        }
        selected = [position];
        noteTrackSlots[selected[0]].classList.add("noteTrack-selected");
    }
}

function hookupLyreButtons() {
    for (let i = 0; i < lyreDivElement.childNodes.length; i++) {
        const child = lyreDivElement.childNodes[i];
        if (child.tagName != "BUTTON") {
            continue;
        }
        child.onclick = () => {
            synth.triggerAttackRelease(child.value, "4n");
            for (let i = 0; i < selected.length; i++) {
                addNoteAt(child.value, selected[i]);
            }
        };
    }
}

function startPlaying() {
    if (lastPlayingNoteTrackSlot != null) {
        lastPlayingNoteTrackSlot.classList.remove("noteTrack-playing");
        lastPlayingNoteTrackSlot = null;
    }
    currentNote = 0;
    Tone.Transport.cancel();
    Tone.Transport.stop();
    console.log("start");
    bpm = parseInt(bpmInput.value);
    Tone.Transport.bpm.value = bpm;
    Tone.Transport.scheduleRepeat(function(time){
        if (lastPlayingNoteTrackSlot != null) {
            lastPlayingNoteTrackSlot.classList.remove("noteTrack-playing");
        }
        noteTrackSlots[currentNote].classList.add("noteTrack-playing");
        for (let i = 0; i < noteTrack[currentNote].length; i++) {
            synth.triggerAttackRelease(noteTrack[currentNote][i], "8n", time);
        }
        lastPlayingNoteTrackSlot = noteTrackSlots[currentNote];
        currentNote++;
        currentNote = currentNote >= noteTrack.length ? 0 : currentNote;
    }, "8n");
    Tone.Transport.start();
}

function stopPlaying() {
    console.log("stop");
    if (lastPlayingNoteTrackSlot != null) {
        lastPlayingNoteTrackSlot.classList.remove("noteTrack-playing");
        lastPlayingNoteTrackSlot = null;
    }
    currentNote = 0;
    Tone.Transport.cancel();
    Tone.Transport.stop();
}

function addNoteAt(note, location) {
    if (note == "x") {
        noteTrackSlots[location].childNodes[1].innerText = "x";
        noteTrack[location] = [];
        return;
    }
    if (addingNote) {
        noteTrackSlots[location].childNodes[1].innerText += "\n"+note;
        noteTrack[location].push(note);
        addingNote = false;
    } else {
        noteTrackSlots[location].childNodes[1].innerText = note;
        noteTrack[location] = [note];
    }
}

function keyPressed(event) {
    console.log(event);
    if (event.key == "ArrowLeft") {
        if (event.shiftKey) {
            if (selected.length > 0 && selected[0]-1 > 0) {
                selected.splice(0, 0, selected[0]-1);
                noteTrackSlots[selected[0]].classList.add("noteTrack-selected");
            }
        } else {
            for (let i = selected.length-1; i >= 0; i--) {
                noteTrackSlots[selected[i]].classList.remove("noteTrack-selected");
                if (selected[i]-1 < 0) {
                    selected.splice(i, 1);
                } else {
                    selected[i] = selected[i]-1;
                }
            }
            for (let i = 0; i < selected.length; i++) {
                noteTrackSlots[selected[i]].classList.add("noteTrack-selected");
            }
        }
        addingNote = false;
    } else if (event.key == "ArrowRight") {
        if (event.shiftKey) {
            if (selected.length > 0 && selected[selected.length-1]+1 <= noteTrack.length) {
                selected.push(selected[selected.length-1]+1);
                noteTrackSlots[selected[selected.length-1]].classList.add("noteTrack-selected");
            }
        } else {
            for (let i = selected.length-1; i >= 0; i--) {
                noteTrackSlots[selected[i]].classList.remove("noteTrack-selected");
                if (selected[i]+1 >= noteTrack.length) {
                    selected.splice(i, 1);
                } else {
                    selected[i] = selected[i]+1;
                }
            }
            for (let i = 0; i < selected.length; i++) {
                noteTrackSlots[selected[i]].classList.add("noteTrack-selected");
            }
        }
        addingNote = false;
    } else if (event.key.toUpperCase() == "O") {
        selected.reverse();
        for (let i = selected.length-1; i >= 0; i--) {
            noteTrackSlots[selected[i]].classList.remove("noteTrack-selected");
            if (selected[i]-1 < 0) {
                noteTrack[selected[i]] = [];
                selected.splice(i, 1);
            } else {
                noteTrack[selected[i]-1] = noteTrack[selected[i]];
                noteTrack[selected[i]] = [];
                selected[i] = selected[i]-1;
            }
        }
        selected.reverse();
        for (let i = 0; i < selected.length; i++) {
            noteTrackSlots[selected[i]].classList.add("noteTrack-selected");
        }
        updateUITrackNotes();
        addingNote = false;
    } else if (event.key.toUpperCase() == "P") {
        for (let i = selected.length-1; i >= 0; i--) {
            noteTrackSlots[selected[i]].classList.remove("noteTrack-selected");
            if (selected[i]+1 >= noteTrack.length) {
                noteTrack[selected[i]] = [];
                selected.splice(i, 1);
            } else {
                noteTrack[selected[i]+1] = noteTrack[selected[i]];
                noteTrack[selected[i]] = [];
                selected[i] = selected[i]+1;
            }
        }
        for (let i = 0; i < selected.length; i++) {
            noteTrackSlots[selected[i]].classList.add("noteTrack-selected");
        }
        updateUITrackNotes();
        addingNote = false;
    } else if (event.key == "x" || event.key == "Backspace") {
        for (let i = 0; i < selected.length; i++) {
            addNoteAt("x", selected[i]);
        }
    } else if (event.key == "c" && event.ctrlKey) {
        copied = [];
        for (let i = 0; i < selected.length; i++) {
            copied.push(noteTrack[selected[i]]);
        }
    } else if (event.key == "v" && event.ctrlKey) {
        let trackPos = selected[0];
        for (let i = 0; i < copied.length; i++) {
            if (trackPos >= noteTrack.length) {
                break;
            }
            noteTrack[trackPos] = copied[i];
            trackPos++;
        }
        updateUITrackNotes();
    } else if (event.key == " ") {
        if (Tone.Transport.state == "started") {
            stopPlaying();
        } else {
            startPlaying();
        }
    } else if (allowedNoteKeys.indexOf(event.key.toUpperCase()) != -1) {
        composedNote = event.key.toUpperCase();
    } else if (allowedNoteNums.indexOf(event.key) != -1) {
        composedNote += event.key;
        if (allowedNotes.indexOf(composedNote) != -1) {
            for (let i = 0; i < selected.length; i++) {
                addNoteAt(composedNote, selected[i]);
            }
        }
    }
    if (event.key == "+" || event.key == ",") {
        addingNote = true;
    }
}
