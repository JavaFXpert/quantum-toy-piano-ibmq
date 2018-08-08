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
//TODO: Implement ideas from Bret Victor's Tangle project

// register the stochastic-matrix component
Vue.component('stochastic-matrix', {
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
            '<input type="number" min="0" max="1" step="0.1" v-model="mathmatrix[rowIdx][colIdx]"/>' +
          '</td>' +
          '<td>' +
            '{{parseFloat(Math.round(rowTotal(rowIdx) * 100) / 100).toFixed(2)}}' +
          '</td>' +
        '</tr>' +
        '<tr>' +
          '<th>Tot</th>' +
          '<td v-for="(colNum, colIdx) in numrowscols">' +
            '{{parseFloat(Math.round(colTotal(colIdx) * 100) / 100).toFixed(2)}}' +
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
    },
    colTotal: function(cIdx) {
      var total = 0.0;
      for (var rIdx = 0; rIdx < this.numrowscols; rIdx++) {
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

