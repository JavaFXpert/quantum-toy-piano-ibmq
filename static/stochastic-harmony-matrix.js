//TODO: Implement ideas from Bret Victor's Tangle project
//TODO: Fold this back into stochastic-matrix component

// register the stochastic-harmony-matrix component
Vue.component('stochastic-harmony-matrix', {
  props: {
    numrowscols: Number,
    colnames: Array,
    //TODO: study how to be able to camel case rownames, etc. in Vue
    rownames: Array,
    mathmatrix: Array
  },
  replace: true, //TODO: Learn what replace means
  template:
    '<table>' +
      '<thead>' +
        '<tr>' +
          '<th></th>' +
          '<th v-for="col in numrowscols">' +
            '{{colnames[col - 1]}}' +
          '</th>' +
          '<th>Tot</th>' +
        '</tr>' +
      '</thead>' +
      '<tbody>' +
        '<tr v-for="(rowArray, rowIdx) in numrowscols">' +
          '<th>{{rownames[rowIdx]}}</th>' +
          '<td v-for="(colNum, colIdx) in numrowscols">' +
            '<input type="text" size="3" v-model="mathmatrix[rowIdx][colIdx]"/>' +
          '</td>' +
          '<td>' +
            '{{parseFloat(Math.round(rowTotal(rowIdx) * 100) / 100).toFixed(2)}}' +
          '</td>' +
        '</tr>' +
      '</tbody>' +
    '</table>',
  methods: {
    rowTotal: function(rIdx) {
      var total = 0.0;
      for (var cIdx = 0; cIdx < this.numrowscols; cIdx++) {
        try {
          total += parseFloat(this.mathmatrix[rIdx][cIdx]);
        }
        catch(err) {
          console.log("err: " + err);
        }
      }
      return total;
    }
  }
});

