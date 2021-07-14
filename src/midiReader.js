function createTabFromMidi(midi, trackNumber, availableNotes) {
    let track = midi.tracks[trackNumber];
    let notes = track.notes;
    let tempo = midi.header.tempos[0];
    let noteTrack = [];
    let noteTrackLengths = [];
    let bestTranspostion = 0;
    let maxFit = 0;
    let availableNotesMidi = convertAvailableNotesToMidiNotes(availableNotes);
    for (let transposition = -48; transposition < 36; transposition++) {
        let fit = calculateTranspositionNotesFit(notes, transposition, availableNotesMidi);
        if (fit > maxFit) {
            maxFit = fit;
            bestTranspostion = transposition;
        }
    }
    /*for (let i = 0; i < notes.length; i++) {
        const element = array[i];
        
    }*/
    return {noteTrack: noteTrack, noteTrackLengths: noteTrackLengths, transposedBy: bestTranspostion, bpm: tempo};
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

function loadMidiFile(file, callback) {
    file.arrayBuffer().then(buffer => {
        let midi = new Midi(buffer);
        callback(midi);
    });
}

export {createTabFromMidi, loadMidiFile};