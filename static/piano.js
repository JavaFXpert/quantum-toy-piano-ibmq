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

// var perf = {
//   meas: []
// };

var numInstruments = 3;
var instrumentsOffset = 29;
var userInstrument = 0;
var qcInstrument = 1;
var bellInstrument = 2;
var soundpack=[];
var soundpack_index=[1,1.5,2,2.5,3,4,4.5,5,5.5,6,6.5,7,
  8,8.5,9,9.5,10,11,11.5,12,12.5,13,13.5,14,
  15,15.5,16,16.5,17,18,18.5,19,19.5,20,20.5,21,
  22,22.5,23,23.5,24,25,25.5,26,26.5,27,27.5,28,29];
for (var instNum = 0; instNum < numInstruments; instNum++) {
  for (var idxA = 0; idxA < soundpack_index.length; idxA++) {
    soundpack.push({
      number: soundpack_index[idxA],
      url: "piano-sounds/" + soundpack_index[idxA] + "-st.wav"
    });
  }
  for (var idxB = 0; idxB < soundpack_index.length; idxB++) {
    soundpack.push({
      number: soundpack_index[idxB] + instrumentsOffset,
      url: "acoustic-guitar/" + soundpack_index[idxB] + "-ag.wav"
    });
  }
  for (var idxC = 0; idxC < soundpack_index.length; idxC++) {
    soundpack.push({
      number: soundpack_index[idxC] + instrumentsOffset * 2,
      url: "bell-sounds/" + soundpack_index[idxC] + "-be.wav"
    });
  }
}

var vm = Vue.component('piano-component', {
  template:
    '<div>' +
      '<div>' +
        '<div class="audioplayer" v-for="s in sounddata">' +
          '<audio :data-num="s.number">' +
            '<source :src="s.url" type="audio/ogg"/>' +
          '</audio>' +
        '</div>' +
      '</div>' +
      '<div class="center_box">' +
        '<div class="keyboard">' +
          '<div class="pianokey" v-for="s in display_keys">' +
            '<div class="white" v-if="s.type==&quot;white&quot;" @click="addnote(s.num)" :class="get_current_highlight(s.num,s.key)?&quot;playing&quot;:&quot;&quot;">' +
              // '<div class="label">{{String.fromCharCode(s.key)}}</div>' +
            '</div>' +
            '<div class="black" v-if="s.type==&quot;black&quot;" @click="addnote(s.num)" :class="get_current_highlight(s.num,s.key)?&quot;playing&quot;:&quot;&quot;">' +
              // '<div class="label">{{String.fromCharCode(s.key)}}</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="controls">' +
        '<br/>' +
        '<input type="checkbox" id="simulatorselect" @click="togglesimulator" checked="usesimulator"/>' +
        '<label for="simulatorselect" class="mr-4">&nbsp;Use simulator</label>' +
        '<br/>' +
        '<button @click="request_counterpoint(1)">Species 1</button>' +
        '<button @click="request_counterpoint(2)">Species 2</button>' +
        '<button @click="request_counterpoint(3)">Species 3</button>' + '&nbsp;' +
        '<button v-if="playing_time&lt;=1" @click="startplay">Play<i class="fa fa-play"></i></button>' +
        '<button v-if="playing_time&gt;1" @click="stopplay">Stop<i class="fa fa-pause"></i></button>' + '&nbsp;' +
        '<button @click="jam(1)">J1</button>' +
        '<button @click="jam(2)">J2</button>' +
        '<button @click="jam(3)">J3</button>' +
        '<button @click="jam(4)">J4</button>' +
        '<button @click="jam(5)">J5</button>' +
        '<button v-if="jamming">JAMMING...<i class="fa fa-play"></i></button>' +
        '<br/><br/>' +
        '<p>Choose a <a href="https://en.wikipedia.org/wiki/Counterpoint#Species_counterpoint" ' +
          'target="_blank"> counterpoint species</a> to perform by clicking one of the Species' +
          ' buttons above. When the dialog appears that contains a string representing the performance,' +
          ' you may optionally paste it into a Lilypond music score engraver. After clicking the OK' +
          ' button, click the Play button to hear a performance by the quantum computer or simulator' +
          ' of the quantum music you composed.</p>' +
        '<ul class="notes_list" v-if="notes.length&gt;0">' +
          '<li v-for="(note,id) in notes" :class="now_note_id-1==id?&quot;playing&quot;:&quot;&quot;">' +
            '<div class="num">{{pitches[note.num - 1]}}</div>' +
            '<div class="time">{{note.time}}</div>' +
          '</li>' +
        '</ul>' +
      '</div>' +
    '</div>',
  data: function () {
    return {
      usesimulator: true,
      sounddata: soundpack,
      // notes: [{"num": 1, "time": 150}, {"num": 1, "time": 265}, {"num": 5, "time": 380}, {
      //   "num": 5,
      //   "time": 501
      // }, {"num": 6, "time": 625}, {"num": 6, "time": 748}, {"num": 5, "time": 871}, {"num": 4, "time": 1126}, {
      //   "num": 4,
      //   "time": 1247
      // }, {"num": 3, "time": 1365}, {"num": 3, "time": 1477}, {"num": 2, "time": 1597}, {
      //   "num": 2,
      //   "time": 1714
      // }, {"num": 1, "time": 1837}],
      notes: [],
      now_note_id: 0,
      next_note_id: 0,
      playing_time: 0,
      record_time: 0,
      now_press_key: -1,
      player: null,
      recorder: null,
      initial_pitch_idx: 0, // Zero-based initial pitch index for generating counterpoint
      //TODO: Consider removing key attribute in display_keys
      display_keys: [
        {num: 1, key: 90, type: 'white'},
        {num: 1.5, key: 83, type: 'black'},
        {num: 2, key: 88, type: 'white'},
        {num: 2.5, key: 68, type: 'black'},
        {num: 3, key: 67, type: 'white'},
        {num: 4, key: 86, type: 'white'},
        {num: 4.5, key: 71, type: 'black'},
        {num: 5, key: 66, type: 'white'},
        {num: 5.5, key: 72, type: 'black'},
        {num: 6, key: 78, type: 'white'},
        {num: 6.5, key: 74, type: 'black'},
        {num: 7, key: 77, type: 'white'},
        {num: 8, key: 81, type: 'white'},
        {num: 8.5, key: 50, type: 'black'},
        {num: 9, key: 87, type: 'white'},
        {num: 9.5, key: 51, type: 'black'},
        {num: 10, key: 69, type: 'white'},
        {num: 11, key: 82, type: 'white'},
        {num: 11.5, key: 53, type: 'black'},
        {num: 12, key: 84, type: 'white'},
        {num: 12.5, key: 54, type: 'black'},
        {num: 13, key: 89, type: 'white'},
        {num: 13.5, key: 55, type: 'black'},
        {num: 14, key: 85, type: 'white'},
        {num: 15, key: 73, type: 'white'},
        {num: 15.5, key: 83, type: 'black'},
        {num: 16, key: 88, type: 'white'},
        {num: 16.5, key: 68, type: 'black'},
        {num: 17, key: 67, type: 'white'},
        {num: 18, key: 86, type: 'white'},
        {num: 18.5, key: 71, type: 'black'},
        {num: 19, key: 66, type: 'white'},
        {num: 19.5, key: 72, type: 'black'},
        {num: 20, key: 78, type: 'white'},
        {num: 20.5, key: 74, type: 'black'},
        {num: 21, key: 77, type: 'white'},
        {num: 22, key: 81, type: 'white'},
        {num: 22.5, key: 50, type: 'black'},
        {num: 23, key: 87, type: 'white'},
        {num: 23.5, key: 51, type: 'black'},
        {num: 24, key: 69, type: 'white'},
        {num: 25, key: 82, type: 'white'},
        {num: 25.5, key: 53, type: 'black'},
        {num: 26, key: 84, type: 'white'},
        {num: 26.5, key: 54, type: 'black'},
        {num: 27, key: 89, type: 'white'},
        {num: 27.5, key: 55, type: 'black'},
        {num: 28, key: 85, type: 'white'},
        {num: 29, key: 73, type: 'white'}
      ],
      pitches: ['c', 'd', 'e', 'f', 'g', 'a', 'b',
        'C', 'D', 'E', 'F', 'G', 'A', 'B',
        'C\'', 'D\'', 'E\'', 'F\'', 'G\'', 'A\'', 'B\'',
        'C\'\'', 'D\'\'', 'E\'\'', 'F\'\'', 'G\'\'', 'A\'\'', 'B\'\'', 'C\'\'\'',
        'c', 'd', 'e', 'f', 'g', 'a', 'b',
        'C', 'D', 'E', 'F', 'G', 'A', 'B',
        'C\'', 'D\'', 'E\'', 'F\'', 'G\'', 'A\'', 'B\'',
        'C\'\'', 'D\'\'', 'E\'\'', 'F\'\'', 'G\'\'', 'A\'\'', 'B\'\'', 'C\'\'\'',
        'c', 'd', 'e', 'f', 'g', 'a', 'b',
        'C', 'D', 'E', 'F', 'G', 'A', 'B',
        'C\'', 'D\'', 'E\'', 'F\'', 'G\'', 'A\'', 'B\'',
        'C\'\'', 'D\'\'', 'E\'\'', 'F\'\'', 'G\'\'', 'A\'\'', 'B\'\'', 'C\'\'\''
      ],
      numNoteOnEvents: 0,
      measurements: {},
      measurementsOriginal: {},
      numBeatsUserPlaysInPhrase: 0,
      numBeatsQcPlaysInPhrase: 0,
      quarterNoteDuration: 0,
      phraseStartTime: 0,
      phraseEndTime: 0,
      jamming: false
    }
  },
  methods: {
    togglesimulator: function () {
      this.usesimulator = !(this.usesimulator);
    },
    playnote: function(id,volume){
      if (id>0){
        var audio_obj=$("audio[data-num='"+id+"']")[0];
        audio_obj.volume=volume;
        audio_obj.currentTime=0;
        audio_obj.play();
      }
    },
    playnext: function(volume){
      if (this.notes[this.now_note_id] != undefined) {
        var play_note = this.notes[this.now_note_id].num;
        this.playnote(play_note, volume);
        this.now_note_id += 1;
      }
      // TODO: Decide when to stop playing
      // if (this.now_note_id>=this.notes.length){
      //   this.stopplay();
      // }
    },
    startplay: function(){
      this.now_note_id=0;
      this.playing_time=0;
      this.next_note_id=0;
      var vobj=this;
      this.player=setInterval(function(){
        if (vobj.notes[vobj.next_note_id] != undefined) {
          if (vobj.playing_time>=vobj.notes[vobj.next_note_id].time) {
            vobj.playnext(1);
            vobj.next_note_id++;
            vobj.jamming = false;
          }
          else {
            vobj.jamming = true;
          }
        }
        vobj.playing_time++;
      },2);
    },
    stopplay: function(){
      clearInterval(this.player);
      this.now_note_id=0;
      this.playing_time=0;
      this.next_note_id=0;
    },
    get_current_highlight: function(id,skey){
      if (this.now_press_key==skey)
        return true;
      if (this.notes.length==0)
        return false
      var cur_id=this.now_note_id-1;
      if (cur_id<0) cur_id=0;
      var num = 1.0;
      if (this.notes[cur_id] != undefined) {
        this.notes[cur_id].num;
      }
      if (num==id)
        return true;
      return false;
    },
    addnote: function(id){
      if (this.record_time>0) {
        this.notes.push({num: id, time: this.record_time});
      }
      else {
        this.initial_pitch_idx = id - 1;
      }
      // TODO use volume from noteon event
      this.playnote(id,1);
    },
    addnotedelayed: function(id, delayms){
      this.notes.push({num: id, time: this.playing_time + delayms});
      //this.playnote(id,1);
    },
    request_counterpoint: function(species_arg) {
      this.notes = [];
      this.stopplay();
      var quantum_music_host = "http://localhost:5002";

      var melodyDegrees = [];
      var harmonyDegrees = [];

      for (var idx = 0; idx < rotationDegOfFreedom; idx++) {
        melodyDegrees.push(rv.rotationangles[idx].value);
        if (hrv.harmonyenabled) {
          harmonyDegrees.push(hrv.rotationangles[idx].value);
        }
      }

      var melodyDegreesStr = melodyDegrees.join(",");
      var harmonyDegreesStr = "";
      if (hrv.harmonyenabled) {
        harmonyDegreesStr = harmonyDegrees.join(",");
      }

      var vobj = this;
      axios.get(quantum_music_host +
          "/toy_piano_counterpoint?pitch_index=" + this.initial_pitch_idx + "&species=" + species_arg +
          "&melodic_degrees=" + melodyDegreesStr +
          "&harmonic_degrees=" + harmonyDegreesStr +
          "&use_simulator=" + this.usesimulator)
          .then(function (response) {
            vobj.load_notes_from_response(response);
          })
          .catch(function (error) {
            console.log(error);
          });
      this.initial_pitch_idx = 0;
    },

    load_notes_from_response: function(resp) {
      console.log(resp)

      if (rv.bellState) {
        if (hrv.bellState || !hrv.harmonyenabled) {
          for (var idx in resp.data.toy_piano) {
            resp.data.toy_piano[idx].num += (bellInstrument * instrumentsOffset);
          }
        }
      }

      this.notes = resp.data.toy_piano;
      this.measurementsOriginal = resp.data.full_res_dict;
      this.measurements = $.extend(true, {}, this.measurementsOriginal);
      alert(resp.data.lilypond)
    },

    /*
       Jam with the QC.
       userPhraseBeats is number of beats out of 8 that the user will play in each phrase
     */
    jam: function(userPhraseBeats) {
      this.measurements = $.extend(true, {}, this.measurementsOriginal);
      this.numNoteOnEvents = 0;

      this.jamming = false;

      // Variable for total number of beats in shared phrase between user and QC
      var numBeatsInSharedPhrase = userPhraseBeats >= 4 ? 8 : userPhraseBeats * 2;

      numBeatsUserPlaysInPhrase = userPhraseBeats;

      numBeatsQcPlaysInPhrase = numBeatsInSharedPhrase - userPhraseBeats;

      quarterNoteDurationMax = 250;
      quarterNoteDurationDefault = 150;

      // Constant quarter note duration factor
      var quarterNoteDurationFactor = 0.25;

      this.notes = [];
      this.stopplay();
      this.startplay();

      var jobj = this;
      WebMidi.enable(function (err) {

        if (err) {
          alert("WebMidi could not be enabled");
        }
        else {
          console.log("WebMidi enabled!");
          console.log(WebMidi.inputs);
          midiInput = WebMidi.inputs[0];

          midiInput.addListener('noteon', "all",
            function (e) {
              if (jobj.numNoteOnEvents % numBeatsUserPlaysInPhrase == 0) {
                this.phraseStartTime = Date.now();
              }

              jobj.numNoteOnEvents++;
              var noteName = e.note.name;
              var noteOctave = e.note.octave;
              var noteNameOctave = noteName + noteOctave;
              var noteMidiNumber = WebMidi.noteNameToNumber(noteNameOctave);
              console.log("Received 'noteon' message (" + noteNameOctave + ", " + jobj.numNoteOnEvents + ").");

              var toyPianoPitchNum = jobj.noteToToyPianoPitch(noteNameOctave, userInstrument);
              console.log("toyPianoPitchNum: " + toyPianoPitchNum);

              if (!jobj.jamming) {
                jobj.addnotedelayed(toyPianoPitchNum, 0);
              }
              else {
                // if user played a note while QC was jamming, play the note but don't respond
                jobj.playnote(toyPianoPitchNum, 1);
                jobj.numNoteOnEvents--;
                return;
              }


              if (jobj.numNoteOnEvents % numBeatsUserPlaysInPhrase == 0) {
                this.phraseEndTime = Date.now();
                if (numBeatsUserPlaysInPhrase == 1) {
                  this.quarterNoteDuration = quarterNoteDurationDefault;
                }
                else {
                  this.quarterNoteDuration = ((this.phraseEndTime - this.phraseStartTime) /
                    (numBeatsUserPlaysInPhrase - 1) * quarterNoteDurationFactor) | 0;
                  this.quarterNoteDuration = Math.min(this.quarterNoteDuration, quarterNoteDurationMax);
                }

                jobj.jamming = true;

                var basisState = jobj.noteToBasisState(noteName, noteOctave);


                if (hrv.harmonyenabled) {
                  if (numBeatsUserPlaysInPhrase == 5) {
                    // Play harmony on the user's down beat
                    // Get harmony note for note that user played
                    var measHarmonyBasisState = jobj.popMeas(basisState, true);
                    console.log('popMeas harmony for' + measHarmonyBasisState + ": " + measHarmonyBasisState);

                    var harmonyNoteNameOctave = jobj.basisStateToNote(measHarmonyBasisState, noteOctave + 1);

                    var harmonyToyPianoPitchNum =
                      jobj.noteToToyPianoPitch(harmonyNoteNameOctave, jobj.getQcInstrument());
                    console.log('harmonyToyPianoPitchNum: ' + harmonyToyPianoPitchNum);

                    jobj.addnotedelayed(harmonyToyPianoPitchNum, 0);
                  }
                }


                // Get melody note to follow note that user played
                var measMelodyBasisState = jobj.popMeas(basisState, false);
                console.log('popMeas melody1 for' + basisState + ": " + measMelodyBasisState);

                var melodyNoteNameOctave = jobj.basisStateToNote(measMelodyBasisState, noteOctave);

                var melodyToyPianoPitchNum =
                    jobj.noteToToyPianoPitch(melodyNoteNameOctave, jobj.getQcInstrument());
                console.log('melodyToyPianoPitchNum 1: ' + melodyToyPianoPitchNum);

                jobj.addnotedelayed(melodyToyPianoPitchNum, this.quarterNoteDuration);


                if (hrv.harmonyenabled) {
                  if (numBeatsUserPlaysInPhrase != 5) {
                    // Play harmony on the QC down beat
                    // Get harmony note for melody note
                    var measHarmonyBasisState = jobj.popMeas(measMelodyBasisState, true);
                    console.log('popMeas harmony for' + measHarmonyBasisState + ": " + measHarmonyBasisState);

                    var harmonyNoteNameOctave = jobj.basisStateToNote(measHarmonyBasisState, noteOctave + 1);

                    var harmonyToyPianoPitchNum =
                      jobj.noteToToyPianoPitch(harmonyNoteNameOctave, jobj.getQcInstrument());
                    console.log('harmonyToyPianoPitchNum: ' + harmonyToyPianoPitchNum);

                    jobj.addnotedelayed(harmonyToyPianoPitchNum, 0);
                  }
                }

                // TODO: Refactor following blocks into a loop
                if (numBeatsQcPlaysInPhrase >= 2) {
                    // Get 2nd melody note to follow 1st melody note
                    measMelodyBasisState = jobj.popMeas(measMelodyBasisState, false);
                    console.log('popMeas melody2 for' + measMelodyBasisState + ": " + measMelodyBasisState);

                    melodyNoteNameOctave = jobj.basisStateToNote(measMelodyBasisState, noteOctave);

                    melodyToyPianoPitchNum =
                        jobj.noteToToyPianoPitch(melodyNoteNameOctave, jobj.getQcInstrument());
                    console.log('melodyToyPianoPitchNum 2: ' + melodyToyPianoPitchNum);

                    jobj.addnotedelayed(melodyToyPianoPitchNum, this.quarterNoteDuration * 2);
                }


                if (numBeatsQcPlaysInPhrase >= 3) {
                    // Get 3rd melody note to follow 2st melody note
                    measMelodyBasisState = jobj.popMeas(measMelodyBasisState, false);
                    console.log('popMeas melody2 for' + measMelodyBasisState + ": " + measMelodyBasisState);

                    melodyNoteNameOctave = jobj.basisStateToNote(measMelodyBasisState, noteOctave);

                    melodyToyPianoPitchNum =
                        jobj.noteToToyPianoPitch(melodyNoteNameOctave, jobj.getQcInstrument());
                    console.log('melodyToyPianoPitchNum 2: ' + melodyToyPianoPitchNum);

                    jobj.addnotedelayed(melodyToyPianoPitchNum, this.quarterNoteDuration * 3);
                }

                if (numBeatsQcPlaysInPhrase >= 4) {
                  // Get 4th melody note to follow 3rd melody note
                  measMelodyBasisState = jobj.popMeas(measMelodyBasisState, false);
                  console.log('popMeas melody3 for' + measMelodyBasisState + ": " + measMelodyBasisState);

                  melodyNoteNameOctave = jobj.basisStateToNote(measMelodyBasisState, noteOctave);

                  melodyToyPianoPitchNum =
                      jobj.noteToToyPianoPitch(melodyNoteNameOctave, jobj.getQcInstrument());
                  console.log('melodyToyPianoPitchNum 3: ' + melodyToyPianoPitchNum);

                  jobj.addnotedelayed(melodyToyPianoPitchNum, this.quarterNoteDuration * 4);
                }

              }
            }
          );

          midiInput.addListener('noteoff', "all",
            function (e) {
              var noteName = e.note.name;
              var noteOctave = e.note.octave;
              var noteNameOctave = noteName + noteOctave;
              var noteMidiNumber = WebMidi.noteNameToNumber(noteNameOctave);
              //console.log("Received 'noteoff' message (" + noteNameOctave + ").");
            }
          );

        }
      });
    },

    /*
       Inputs: Note name (e.g. "C") and octave (e.g. 4)
       Returns: Basis state (e.g. "000") for note and octave
     */
    noteToBasisState: function(name, octave) {
      var basisState;
      var naturalNoteName = name.substring(0, 1);
      if (naturalNoteName === "C") {
        if (octave >= 4) {
          basisState = "000";
        }
        else {
          basisState = "111";
        }
      }
      else if (naturalNoteName === "D") {
        basisState = "001";
      }
      else if (naturalNoteName === "E") {
        basisState = "010";
      }
      else if (naturalNoteName === "F") {
        basisState = "011";
      }
      else if (naturalNoteName === "G") {
        basisState = "100";
      }
      else if (naturalNoteName === "A") {
        basisState = "101";
      }
      else if (naturalNoteName === "B") {
        basisState = "110";
      }
      return basisState;
    },

    /*
       Inputs: Basis state (e.g. "000") and octave (e.g. 3)
       Returns: Note name (e.g. "C3") corresponding to basis state and octave.
                For example, when "000" and 3 are input, output is C3, but
                when "111" and 3 are input, "C4" is output.
     */
    basisStateToNote: function(basisState, octave) {
      var noteName;
      var octaveNum = octave;
      if (basisState === "000") {
        noteName = "C";
      }
      else if (basisState === "001") {
        noteName = "D";
      }
      else if (basisState === "010") {
        noteName = "E";
      }
      else if (basisState === "011") {
        noteName = "F";
      }
      else if (basisState === "100") {
        noteName = "G";
      }
      else if (basisState === "101") {
        noteName = "A";
      }
      else if (basisState === "110") {
        noteName = "B";
      }
      else if (basisState === "111") {
        noteName = "C";
        octaveNum++;
      }
      return noteName + octaveNum;
    },

    /*
       Inputs: Note name including octave (e.g. "C4")
       Returns: Toy piano pitch for note and octave
     */
    noteToToyPianoPitch: function(nameOctave, instrumentIndex) {
      //var noteMidiNumber = WebMidi.noteNameToNumber(name + octave);
      var toyPianoNoteOffset = 0;
      var toyPianoNoteNum = 0;
      var naturalName = nameOctave.slice(0, 1)
      var sharp = nameOctave.length == 3 && nameOctave.slice(1, 2) === "#";
      var octave = +(nameOctave.slice(-1));
      if (octave <= 2) {
        toyPianoNoteOffset = 0;
      }
      else if (octave == 3) {
        toyPianoNoteOffset = 7;
      }
      else if (octave == 4) {
        toyPianoNoteOffset = 14;
      }
      else if (octave == 5) {
        toyPianoNoteOffset = 21;
      }
      else if (octave >= 6) {
        if (naturalName === "C") {
          toyPianoNoteOffset = 28;
        }
        else {
          toyPianoNoteOffset = 21;
        }
      }

      if (naturalName === "C") {
        toyPianoNoteNum = 1;
      }
      else if (naturalName === "D") {
        toyPianoNoteNum = 2;
      }
      else if (naturalName === "E") {
        toyPianoNoteNum = 3;
      }
      else if (naturalName === "F") {
        toyPianoNoteNum = 4;
      }
      else if (naturalName === "G") {
        toyPianoNoteNum = 5;
      }
      else if (naturalName === "A") {
        toyPianoNoteNum = 6;
      }
      else if (naturalName === "B") {
        toyPianoNoteNum = 7;
      }

      toyPianoNoteNum +=  + toyPianoNoteOffset;
      if (sharp) {
        toyPianoNoteNum += 0.5
      }

      return instrumentIndex * instrumentsOffset  + toyPianoNoteNum;
    },

    getQcInstrument: function() {
      var instrument = qcInstrument;
      if (rv.bellState) {
        if (hrv.bellState || !hrv.harmonyenabled) {
          instrument = bellInstrument;
        }
      }
      return instrument;
    },

    popMeas: function(basisState, harmony) {
      // key is "000_m" or "000_h" where 000 is a binary number
      var key = basisState;
      if (!!harmony) {
        key += "_h";
      }
      else {
        key += "_m";
      }

      var poppedVal = this.measurements[key].shift();
      if (poppedVal == undefined) {
        console.log("No more measurements for: " + key)
        poppedVal = "111";
      }
      return poppedVal;
    }
  }
});

