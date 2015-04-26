var Chessboard = require('./chessboard');
var LaserMount = require('./lasermount');
var Scene = require('./scene');

var board = new Chessboard({
  edgeLength: 3,
  numSquares: 8
});

var lasers = new LaserMount({
  distance: 1,
  angle: 30
});

var scene = new Scene({
  lasers: lasers,
  board: board,
  position: $V([0,1,0.01])
});

scene.renderToFile(function(err, fnm){
  console.log('Rendered out to '+fnm);
});
