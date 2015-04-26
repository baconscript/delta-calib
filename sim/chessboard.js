require('sylvester');
_ = require('lodash');
fs = require('fs');

function Chessboard(opts){
  this.edgeLength = opts.edgeLength;
  this.numSquares = opts.numSquares;
}

Chessboard.tpl = _.template(fs.readFileSync('chessboard.tpl'));

_.assign(Chessboard.prototype, {
  toPOVRay: function(){
    var len = this.edgeLength / 2;
    var l2 = len*1.2;
    return Chessboard.tpl({
      len: len,
      margin: l2,
      scale: this.edgeLength / this.numSquares
    });
  }
});

module.exports = Chessboard;
