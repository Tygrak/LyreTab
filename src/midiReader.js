function findBestTransposition(midi, trackNumber, availableNotes) {
    let track = midi.tracks[trackNumber];
    let notes = track.notes;
    let maxFit = 0;
    let bestTranspostion = 0;
    let availableNotesMidi = convertAvailableNotesToMidiNotes(availableNotes);
    for (let transposition = -60; transposition < 60; transposition++) {
        let fit = calculateTranspositionNotesFit(notes, transposition, availableNotesMidi);
        if (fit > maxFit) {
            maxFit = fit;
            bestTranspostion = transposition;
        }
    }
    return bestTranspostion;
}

function createTabFromMidi(midi, trackNumber, availableNotes, transposition, tryMatchTime = true, addOutOfRange = true) {
    let track = midi.tracks[trackNumber];
    let notes = track.notes;
    let timeSignature = midi.header.timeSignatures[0];
    let bpm = midi.header.tempos[0].bpm*(timeSignature.timeSignature[1]/timeSignature.timeSignature[0]);
    let availableDurations = calculateNoteDurations(bpm);
    let noteTrack = [];
    let noteTrackLengths = [];
    let missingNotes = [];
    let availableNotesMidi = convertAvailableNotesToMidiNotes(availableNotes);
    let lastPosition = -1;
    let lastDuration = 1;
    for (let i = 0; i < notes.length; i++) {
        let noteName = Tone.Frequency(notes[i].midi+transposition, "midi").toNote();
        if (availableNotesMidi.indexOf(notes[i].midi+transposition) == -1) {
            missingNotes.push(noteName);
            if (!addOutOfRange) {
                continue;
            }
        }
        while (notes[i].time-(lastPosition+lastDuration) > 0.1) {
            let pauseLength = notes[i].time-lastPosition+lastDuration;
            let selectedPauseLength;
            if (tryMatchTime) {
                selectedPauseLength = findNoteDuration(pauseLength, availableDurations).note;
            } else {
                selectedPauseLength = pauseLength;
            }
            noteTrack.push([]);
            noteTrackLengths.push(selectedPauseLength);
            lastPosition = lastPosition+lastDuration;
            lastDuration = selectedPauseLength;
        }
        if (Math.abs(notes[i].time-lastPosition) < 0.001) {
            noteTrack[noteTrack.length-1].push(noteName);
        } else {
            noteTrack.push([noteName]);
            let duration;
            if (tryMatchTime) {
                duration = findNoteDuration(notes[i].duration, availableDurations).note;
            } else {
                duration = notes[i].duration > 0 ? notes[i].duration : 0.001;
            }
            noteTrackLengths.push(duration);
            lastDuration = duration;
        }
        lastPosition = notes[i].time;
    }
    return {noteTrack: noteTrack, noteTrackLengths: noteTrackLengths, transposedBy: transposition, 
            missingNotes: missingNotes, bpm: bpm, duration: notes[notes.length-1].time+notes[notes.length-1].duration};
}

function findNoteDuration(duration, availableDurations) {
    let min = 1000000;
    let minId = -1;
    for (let i = 0; i < availableDurations.length; i++) {
        let diff = Math.abs(duration-availableDurations[i].duration);
        if (diff < min) {
            min = diff;
            minId = i;
        }
    }
    return availableDurations[minId];
}

function calculateNoteDuration(lengthString, bpm) {
    let length = parseInt(lengthString.match(/\d+/)[0]);
    return (240/length)/bpm;
}

function calculateNoteDurations(bpm) {
    let result = [];
    result.push({note: "1n", duration: 240/bpm});
    result.push({note: "2n", duration: 120/bpm});
    result.push({note: "3n", duration: 80/bpm});
    result.push({note: "4n", duration: 60/bpm});
    //result.push({note: "6n", duration: 40/bpm});
    result.push({note: "8n", duration: 30/bpm});
    result.push({note: "16n", duration: 15/bpm});
    result.push({note: "32n", duration: 7.5/bpm});
    return result;
}

function calculateTranspositionNotesFit(notes, transposition, availableNotesMidi) {
    let fitting = 0;
    for (let i = 0; i < notes.length; i++) {
        if (availableNotesMidi.indexOf(notes[i].midi+transposition) != -1) {
            fitting++;
        }
    }
    return fitting;
}

function convertAvailableNotesToMidiNotes(availableNotes) {
    let result = [];
    for (let i = 0; i < availableNotes.length; i++) {
        result.push(Tone.Frequency(availableNotes[i]).toMidi());
    }
    return result;
}

function findUnusedNotes(noteTrack, availableNotes) {
    let result = availableNotes.slice();
    for (let i = 0; i < noteTrack.length; i++) {
        for (let j = 0; j < noteTrack[i].length; j++) {
            const note = noteTrack[i][j];
            let index = result.indexOf(note);
            if (index != -1) {
                result.splice(index, 1);
            }
        }
    }
    return result;
}

function loadMidiFile(file, callback) {
    file.arrayBuffer().then(buffer => {
        let midi = new Midi(buffer);
        callback(midi);
    });
}

export {findBestTransposition, createTabFromMidi, findUnusedNotes, calculateNoteDuration, loadMidiFile};