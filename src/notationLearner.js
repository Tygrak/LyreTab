import * as TabCreator from './lyreTabFormat.js';
import * as MidiReader from './midiReader.js';

const VF = Vex.Flow;

let bpm = 100;

const notationDivElement = document.getElementById("notation-container");
const revealButton = document.getElementById("reveal");
const revealTextElement = document.getElementById("revealText");
const startPlayingButton = document.getElementById("startPlaying");
const stopPlayingButton = document.getElementById("stopPlaying");
const bpmInput = document.getElementById("bpm");
const statusElement = document.getElementById("status-center");

startPlayingButton.onclick = startPlaying;
stopPlayingButton.onclick = stopPlaying;
revealButton.onclick = () => {
    revealTextElement.innerText = createNotesString();
};

document.onkeydown = keyPressed;

const synth = new Tone.PolySynth(Tone.Synth).toDestination();
let allowedNoteKeys = ["A","B","C","D","E","F","G"];
let allowedNoteNums = ["3","4","5"];
let allowedNotes = ["G3","A3","B3","C4","D4","E4","F4","G4","A4","B4","C5","D5","E5","F5","G5","A5"];
let allowedNoteLengths = ["4n", "4n", "8n", "8n", "2n"];

let noteTrack = [];
let noteTrackSlots = [];
let noteTrackLengths = [];
let selected = [];
let currentNote = 0;
let lastPlayingNoteTrackSlot = null;

createRandomNotes(8);
createNotation();

function createNotation() {
    let vf = new VF.Factory({renderer: {elementId: "notation-container"}});
    let score = vf.EasyScore();
    let system = vf.System();

    let notesString = createNotesString();

    let voice = new Vex.Flow.Voice({
        num_beats: 4,
        beat_value: 4,
        resolution: Vex.Flow.RESOLUTION
    });
    voice.setStrict(false);
    voice.addTickables(score.notes(notesString, {stem: 'up'}));

    system.addStave({
        voices: [
            voice,
        ]
    }).addClef('treble').addTimeSignature('4/4');
    vf.draw();
}

function createNotesString() {
    let resultString = "";
    for (let i = 0; i < noteTrack.length; i++) {
        if (i > 0) {
            resultString += ", ";
        }
        if (noteTrack[i].length > 1) {
            resultString += "(";
            for (let j = 0; j < noteTrack[i].length; j++) {
                if (j > 0) {
                    resultString += " ";
                }
                resultString += noteTrack[i][j];
            }
            resultString += ")";
        } else {
            resultString += noteTrack[i][0]
        }
        resultString += "/"+noteLengthToNoteLengthString(noteTrackLengths[i]);
    }
    return resultString;
}

function noteLengthToNoteLengthString(noteLength) {
    if (noteLength == "16n") {
        return "16";
    } else if (noteLength == "8n") {
        return "8";
    } else if (noteLength == "4n") {
        return "q";
    } else if (noteLength == "2n") {
        return "h";
    } else if (noteLength == "1n") {
        return "w";
    }
    return "4";
}

function createRandomNotes(amount) {
    noteTrack = [];
    for (let i = 0; i < amount; i++) {
        noteTrack.push([allowedNotes[Math.floor(Math.random()*allowedNotes.length)]]);
        noteTrackLengths.push(allowedNoteLengths[Math.floor(Math.random()*allowedNoteLengths.length)]);
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
    currentNote = 0;
    Tone.Transport.cancel();
    Tone.Transport.stop();
}

function keyPressed(event) {
    console.log(event);
    if (event.key == " ") {
        if (Tone.Transport.state == "started") {
            statusElement.innerText = "Stopped";
            stopPlaying();
        } else {
            statusElement.innerText = "Playing";
            if (event.shiftKey) {
                startPlaying();
            } else {
                if (selected.length == 0) {
                    startPlaying();
                } else {
                    startPlayingAt(selected[0]);
                }
            }
        }
    }
}
