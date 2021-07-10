import * as TabCreator from './lyreTabFormat.js';

let trackLength = 32;
let bpm = 100;

const noteTrackElement = document.getElementById("noteTrack");
const lyreDivElement = document.getElementById("lyre-instrument");
const startPlayingButton = document.getElementById("startPlaying");
const stopPlayingButton = document.getElementById("stopPlaying");
const bpmInput = document.getElementById("bpm");
const trackLengthInput = document.getElementById("trackLength");
const remakeTrackButton = document.getElementById("remakeTrack");
const saveTrackButton = document.getElementById("saveTrack");

remakeTrackButton.onclick = makeNoteTrack;
startPlayingButton.onclick = startPlaying;
stopPlayingButton.onclick = stopPlaying;
saveTrackButton.onclick = () => {
    let trackString = TabCreator.createTabString(bpm, noteTrack);
    console.log(trackString);
    TabCreator.createDownload(trackString, "track.txt");
};

document.onkeydown = keyPressed;

// todo: add settings page switchable with a button

const synth = new Tone.PolySynth(Tone.Synth).toDestination();
let allowedNoteKeys = ["A","B","C","D","E","F","G"];
let allowedNoteNums = ["3","4","5"];
let allowedNotes = ["G3","A3","B3","C4","D4","E4","F4","G4","A4","B4","C5","D5","E5","F5","G5","A5"];

let noteTrack = [];
let noteTrackSlots = [];
let selected = -1;
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
}

function makeNoteTrack() {
    trackLength = parseInt(trackLengthInput.value);
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
        element.onclick = () => {
            moveSelectTo(i);
        };
        noteTrackElement.appendChild(element);
        noteTrackSlots.push(element);
        noteTrack.push([]);
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
            if (selected != -1) {
                noteTrackSlots[selected].childNodes[1].innerText = child.value;
                noteTrack[i] = child.value;
            }
        };
    }
}

function moveSelectTo(position) {
    if (selected != -1) {
        noteTrackSlots[selected].classList.remove("noteTrack-selected");
    }
    selected = position;
    noteTrackSlots[selected].classList.add("noteTrack-selected");
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
        currentNote = currentNote >= trackLength ? 0 : currentNote;
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

function shiftLeftAt(location) {
    for (let i = 0; i <= location-1; i++) {
        noteTrack[i] = noteTrack[i+1];
        noteTrackSlots[i].childNodes[1].innerText = noteTrackSlots[i+1].childNodes[1].innerText;
        noteTrack[i+1] = [];
        noteTrackSlots[i+1].childNodes[1].innerText = "x";
    }
}

function shiftRightAt(location) {
    for (let i = trackLength-1; i >= location+1; i--) {
        noteTrack[i] = noteTrack[i-1];
        noteTrackSlots[i].childNodes[1].innerText = noteTrackSlots[i-1].childNodes[1].innerText;
        noteTrack[i-1] = [];
        noteTrackSlots[i-1].childNodes[1].innerText = "x";
    }
}

function keyPressed(event) {
    console.log(event);
    if (event.key == "ArrowLeft") {
        if (selected != -1) {
            let next = selected-1 <= 0 ? 0 : selected-1;
            moveSelectTo(next);
            addingNote = false;
        }
    } else if (event.key == "ArrowRight") {
        if (selected != -1) {
            let next = selected+1 >= trackLength ? trackLength-1 : selected+1;
            moveSelectTo(next);
            addingNote = false;
        }
    } else if (event.key.toUpperCase() == "O") {
        if (selected != -1) {
            shiftLeftAt(selected);
        }
    } else if (event.key.toUpperCase() == "P") {
        if (selected != -1) {
            shiftRightAt(selected);
        }
    } else if (allowedNoteKeys.indexOf(event.key.toUpperCase()) != -1) {
        composedNote = event.key.toUpperCase();
    } else if (allowedNoteNums.indexOf(event.key) != -1) {
        composedNote += event.key;
        if (allowedNotes.indexOf(composedNote) != -1) {
            if (selected != -1) {
                if (addingNote) {
                    noteTrackSlots[selected].childNodes[1].innerText += "\n"+composedNote;
                    noteTrack[selected].push(composedNote);
                    addingNote = false;
                } else {
                    noteTrackSlots[selected].childNodes[1].innerText = composedNote;
                    noteTrack[selected] = [composedNote];
                }
            }
        }
    }
    if (event.key == "+" || event.key == ",") {
        addingNote = true;
    }
}
