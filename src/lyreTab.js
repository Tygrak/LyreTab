import * as TabCreator from './lyreTabFormat.js';
import * as MidiReader from './midiReader.js';

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
const midiFileInput = document.getElementById("midiFileInput");
const loadMidiButton = document.getElementById("loadMidi");
const midiTrackToLoadInput = document.getElementById("midiTrackToLoad");
const midiTryMatchTimeCheckbox = document.getElementById("midiTryMatchTime");
const detectedMidiTracksElement = document.getElementById("detectedMidiTracks");

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
loadMidiButton.onclick = () => {
    if (midiFileInput.files.length == 0) {
        return;
    }
    MidiReader.loadMidiFile(midiFileInput.files[0], (midi) => {
        let trackToLoad = parseInt(midiTrackToLoadInput.value);
        console.log("Reading midi: " + midi.tracks[trackToLoad].name);
        let result = MidiReader.createTabFromMidi(midi, trackToLoad, allowedNotes, midiTryMatchTimeCheckbox.checked);
        console.log(result);
        bpmInput.value = result.bpm;
        bpm = result.bpm;
        noteTrack = result.noteTrack;
        trackLengthInput.value = result.noteTrack.length;
        resizeNoteTrack();
        for (let i = 0; i < result.noteTrackLengths.length; i++) {
            setNoteLengthTo(i, result.noteTrackLengths[i]);
        }
        let resultText = "Found tracks: ";
        for (let i = 0; i < midi.tracks.length; i++) {
            if (midi.tracks[i].notes.length == 0) {
                continue;
            }
            resultText += i + ": " + midi.tracks[i].name + ", ";
        }
        if (result.missingNotes.length == 0) {
            resultText += "Matched perfectly.";
        } else {
            resultText += "Missing notes: " + [...new Set(result.missingNotes)];
        }
        detectedMidiTracksElement.innerText = resultText;
        console.log(MidiReader.findUnusedNotes(noteTrack, allowedNotes));
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
let noteTrackLengths = [];
let selected = [];
let copied = [];
let copiedLengths = [];
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
        noteTrackLengths.push("8n");
    }
    noteTrack.length = newTrackLength;
    noteTrackSlots = [];
    noteTrackElement.innerHTML = "";
    for (let i = 0; i < noteTrack.length; i++) {
        let element = document.createElement("span");
        element.classList.add("noteTrack-slot");
        element.classList.add("noteTrack-8th");
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
        element.classList.add("noteTrack-8th");
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
        noteTrackLengths.push("8n");
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
    startPlayingAt(0);
}

function startPlayingAt(location) {
    if (lastPlayingNoteTrackSlot != null) {
        lastPlayingNoteTrackSlot.classList.remove("noteTrack-playing");
        lastPlayingNoteTrackSlot = null;
    }
    currentNote = location;
    Tone.Transport.cancel();
    Tone.Transport.stop();
    console.log("start");
    bpm = parseFloat(bpmInput.value);
    Tone.Transport.bpm.value = bpm;
    let time = 0;
    for (let i = location; i < noteTrack.length; i++) {
        Tone.Transport.schedule(function(time){
            currentNote = i;
            if (lastPlayingNoteTrackSlot != null) {
                lastPlayingNoteTrackSlot.classList.remove("noteTrack-playing");
            }
            noteTrackSlots[currentNote].classList.add("noteTrack-playing");
            lastPlayingNoteTrackSlot = noteTrackSlots[currentNote];
            for (let i = 0; i < noteTrack[currentNote].length; i++) {
                synth.triggerAttackRelease(noteTrack[currentNote][i], noteTrackLengths[currentNote], time);
            }
        }, time);
        time += Tone.Time(noteTrackLengths[i]).toSeconds();
    }
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

function setNoteLengthTo(location, length) {
    if (location < 0 || location > noteTrack.length) {
        return;
    }
    let element = noteTrackSlots[location];
    if (noteTrackLengths[location] == "16n") {
        element.classList.remove("noteTrack-16th");
    } else if (noteTrackLengths[location] == "8n") {
        element.classList.remove("noteTrack-8th");
    } else if (noteTrackLengths[location] == "4n") {
        element.classList.remove("noteTrack-4th");
    } else if (noteTrackLengths[location] == "3n") {
        element.classList.remove("noteTrack-3th");
    } else if (noteTrackLengths[location] == "2n") {
        element.classList.remove("noteTrack-2th");
    } else if (noteTrackLengths[location] == "1n") {
        element.classList.remove("noteTrack-1th");
    } else { 
    }
    if (length == "16n") {
        element.classList.add("noteTrack-16th");
    } else if (length == "8n") {
        element.classList.add("noteTrack-8th");
    } else if (length == "4n") {
        element.classList.add("noteTrack-4th");
    } else if (length == "3n") {
        element.classList.add("noteTrack-3th");
    } else if (length == "2n") {
        element.classList.add("noteTrack-2th");
    } else if (length == "1n") {
        element.classList.add("noteTrack-1th");
    }
    noteTrackLengths[location] = length;
}

function keyPressed(event) {
    console.log(event);
    if (event.key == "ArrowLeft") {
        if (event.shiftKey) {
            if (selected.length > 0 && selected[0]-1 >= 0) {
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
            if (selected.length > 0 && selected[selected.length-1]+1 < noteTrack.length) {
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
    } else if (event.key.toUpperCase() == "Q") {
        for (let i = 0; i < selected.length; i++) {
            setNoteLengthTo(selected[i], "16n");
        }
    } else if (event.key.toUpperCase() == "W") {
        for (let i = 0; i < selected.length; i++) {
            setNoteLengthTo(selected[i], "8n");
        }
    } else if (event.key.toUpperCase() == "E") {
        for (let i = 0; i < selected.length; i++) {
            setNoteLengthTo(selected[i], "4n");
        }
    } else if (event.key.toUpperCase() == "R") {
        for (let i = 0; i < selected.length; i++) {
            setNoteLengthTo(selected[i], "2n");
        }
    } else if (event.key.toUpperCase() == "T") {
        for (let i = 0; i < selected.length; i++) {
            setNoteLengthTo(selected[i], "1n");
        }
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
    } else if (event.key == "x" || event.key == "Backspace" || event.key == "Delete") {
        for (let i = 0; i < selected.length; i++) {
            addNoteAt("x", selected[i]);
        }
    } else if (event.key == "c" && event.ctrlKey) {
        copied = [];
        copiedLengths = [];
        for (let i = 0; i < selected.length; i++) {
            copied.push(noteTrack[selected[i]]);
            copiedLengths.push(noteTrackLengths[selected[i]]);
        }
    } else if (event.key == "v" && event.ctrlKey) {
        let trackPos = selected[0];
        for (let i = 0; i < copied.length; i++) {
            if (trackPos >= noteTrack.length) {
                break;
            }
            noteTrack[trackPos] = copied[i];
            setNoteLengthTo(trackPos, copiedLengths[i]);
            trackPos++;
        }
        updateUITrackNotes();
    } else if (event.key == " ") {
        if (Tone.Transport.state == "started") {
            stopPlaying();
        } else {
            if (event.shiftKey) {
                startPlaying();
            } else {
                startPlayingAt(selected[0]);
            }
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
