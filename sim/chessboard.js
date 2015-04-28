require('sylvester');
var _ = require('lodash');
var fs = require('fs');
var path = require('path');

function Chessboard(opts){
  this.edgeLength = opts.edgeLength;
  this.numSquares = opts.numSquares == null ? 10 : opts.numSquares;
}
var tplPath = path.join(__dirname,'chessboard.tpl');
Chessboard.tpl = _.template(fs.readFileSync(tplPath));

_.assign(Chessboard.prototype, {
  toPOVRay: function(){
    var len = this.edgeLength / 2;
    var l2 = len*1.2;
    return Chessboard.tpl({
      len: len,
      margin: l2,
      scale: this.numSquares === 0 ? 0 : this.edgeLength / this.numSquares,
      showSquares: Boolean(this.numSquares)
    });
  }
});

module.exports = Chessboard;
