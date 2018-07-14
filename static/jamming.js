/*
 * Copyright 2018 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var midiAccess=null;	// the MIDIAccess object.
var activeNotes = [];	// the stack of actively-pressed keys
var outputDevice; // an output MIDI device TODO: Implement output functionality

window.addEventListener('load', function() {
  if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess().then(onMIDIInit, onMIDIReject);
  }
  else {
    alert("No MIDI support present in your browser");
  }

} );

function hookUpMIDIInput() {
  var haveAtLeastOneInputDevice = false;
  var inputs = midiAccess.inputs.values();
  for (var input = inputs.next(); input && !input.done; input = inputs.next()) {
    input.value.onmidimessage = MIDIMessageEventHandler;
    haveAtLeastOneInputDevice = true;
  }
  if (!haveAtLeastOneInputDevice) {
    alert("No MIDI input devices present.");
  }
}

function hookUpMIDIOutput() {
  var haveAtLeastOneOutputDevice=false;
  var outputs=midiAccess.outputs.values();
  for ( var output = outputs.next(); output && !output.done; output = outputs.next()) {
    if (outputDevice == null) {
      outputDevice = output;
    }
    output.value.onmidimessage = MIDIMessageEventHandler;
    haveAtLeastOneOutputDevice = true;
  }
  if (!haveAtLeastOneOutputDevice) {
    //alert("No MIDI output devices present.");
  }
}

function onMIDIInit(midi) {
  midiAccess = midi;

  hookUpMIDIInput();
  midiAccess.onstatechange=hookUpMIDIInput;

  hookUpMIDIOutput();
  //midiAccess.onstatechange=hookUpMIDIOutput;
}

function onMIDIReject(err) {
  alert("The MIDI system failed to start.");
}

function MIDIMessageEventHandler(event) {
  // Mask off the lower nibble (MIDI channel, which we don't care about)
  switch (event.data[0] & 0xf0) {
    case 0x90:
      if (event.data[2]!=0) {  // if velocity != 0, this is a note-on message
        noteOn(event.data[1]);
        return;
      }
    // if velocity == 0, fall thru: it's a note-off.  MIDI's weird, ya'll.
    case 0x80:
      noteOff(event.data[1]);
      return;
  }
}

function noteOn(noteNumber) {
  activeNotes.push( noteNumber );
  console.log('noteNumber: ' + noteNumber);
  console.log('perf.meas: ' + perf.meas['000_m'][0]);

  //callChordAnalyzerService(activeNotes);
}

function noteOff(noteNumber) {
  var position = activeNotes.indexOf(noteNumber);
  if (position!=-1) {
    activeNotes.splice(position,1);
  }
  //callChordAnalyzerService(activeNotes);
}

// register the jamming component
Vue.component('jamming', {
  props: {
  },
  replace: true, //TODO: Learn what replace means
  template:
    '<h1>' +
        'Jamming' +
    '</h1>',
  methods: {
  }
});

