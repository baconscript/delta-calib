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
  cameraPosition: $V([2,-2,1]),
  lookAt: Scene.ORIGIN
});

scene = Scene.mkRandom();

scene.renderToFile(function(err, fnm){
  if(err){
    err.printStackTrace();
    console.error(err);
    process.exit(1);
    return;
  }
  console.log(fnm);
});
