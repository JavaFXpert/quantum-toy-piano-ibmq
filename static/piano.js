
var soundpack=[];
var soundpack_index=[1,1.5,2,2.5,3,4,4.5,5,5.5,6,6.5,7,8,8.5,9,9.5,10,11,11.5,12,12.5,13,13.5,14,15];
for(var i=0;i<soundpack_index.length;i++){
  soundpack.push({
    number: soundpack_index[i],
    //url: "https://awiclass.monoame.com/pianosound/set/"+ soundpack_index[i]+".wav"
    url: "piano-sounds/"+ soundpack_index[i]+".wav"
  });
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
      '</div><br/>' +
      '<div class="controls">' +
        '<ul class="notes_list" v-if="notes.length&gt;0">' +
          '<li v-for="(note,id) in notes" :class="now_note_id-1==id?&quot;playing&quot;:&quot;&quot;">' +
            '<div class="num">{{pitches[note.num - 1]}}</div>' +
            '<div class="time">{{note.time}}</div>' +
          '</li>' +
        '</ul>' +
        '<button @click="request_counterpoint(1)">Species 1</button>' +
        '<button @click="request_counterpoint(2)">Species 2</button>' +
        '<button @click="request_counterpoint(3)">Species 3</button>' +
        '<button v-if="playing_time&lt;=1" @click="startplay">Play<i class="fa fa-play"></i></button>' +
        '<button v-if="playing_time&gt;1" @click="stopplay">Stop<i class="fa fa-pause"></i></button>' +
        '<br/><br/>' +
        '<input type="checkbox" id="simulatorselect" @click="togglesimulator" checked="usesimulator"/>' +
        '<label for="simulatorselect" class="mr-4">Use simulator</label>' +
        '<h4>{{playing_time+record_time}}</h4>' +
      '</div>' +
    '</div>',
  data: function () {
    return {
      usesimulator: true,
      sounddata: soundpack,
      notes: [{"num": 1, "time": 150}, {"num": 1, "time": 265}, {"num": 5, "time": 380}, {
        "num": 5,
        "time": 501
      }, {"num": 6, "time": 625}, {"num": 6, "time": 748}, {"num": 5, "time": 871}, {"num": 4, "time": 1126}, {
        "num": 4,
        "time": 1247
      }, {"num": 3, "time": 1365}, {"num": 3, "time": 1477}, {"num": 2, "time": 1597}, {
        "num": 2,
        "time": 1714
      }, {"num": 1, "time": 1837}],
      now_note_id: 0,
      next_note_id: 0,
      playing_time: 0,
      record_time: 0,
      now_press_key: -1,
      player: null,
      recorder: null,
      initial_pitch_idx: 0, // Zero-based initial pitch index for generating counterpoint
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
        {num: 15, key: 73, type: 'white'}
      ],
      pitches: ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C\'', 'D\'', 'E\'', 'F\'', 'G\'', 'A\'', 'B\'', 'C\'\'']
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
      var play_note=this.notes[this.now_note_id].num;
      this.playnote(play_note,volume);
      this.now_note_id+=1;

      if (this.now_note_id>=this.notes.length){
        this.stopplay();
      }
    },
    startplay: function(){
      this.now_note_id=0;
      this.playing_time=0;
      this.next_note_id=0;
      var vobj=this;
      this.player=setInterval(function(){
        if (vobj.playing_time>=vobj.notes[vobj.next_note_id].time){
          vobj.playnext(1);
          vobj.next_note_id++;
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
      var num=this.notes[cur_id].num;
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
      this.playnote(id,1);
    },
    request_counterpoint: function(species_arg) {
      var quantum_music_host = "http://localhost:5000";
      harmonyDegrees = [];
      melodyDegrees = [];
      for (var idx = 0; idx < rotationDegOfFreedom; idx++) {
        harmonyDegrees.push(rv.rotationangles[idx].value);
        melodyDegrees.push(hrv.rotationangles[idx].value);
      }
      harmonyDegreesStr = harmonyDegrees.join(",");
      melodyDegreesStr = melodyDegrees.join(",");

      var vobj = this;
      axios.get(quantum_music_host +
          "/toy_piano_counterpoint?pitch_index=" + this.initial_pitch_idx + "&species=" + species_arg +
          "&melodic_degrees=" + harmonyDegreesStr +
          "&harmonic_degrees=" + melodyDegreesStr +
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
      alert(resp.data.lilypond)
      this.notes = resp.data.toy_piano;
      //this.startplay();
    }

  }
});

