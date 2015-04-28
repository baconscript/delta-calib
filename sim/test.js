var Chessboard = require('./chessboard');
var LaserMount = require('./lasermount');
var Scene = require('./scene');
var Rx = require('rx');
var sh = require('shelljs').exec;
var path = require('path');
var _ = require('lodash');
var fs = require('fs');

var FIND_INTRINSICS = path.join(__dirname,'../cpp/find-intrinsics/find-intrinsics');
var MK_STANDARD = path.join(__dirname,'../cpp/mk-standard/mk-standard');

var board = new Chessboard({
  edgeLength: 25*8,
  numSquares: 12
});

var lasers = new LaserMount({
  distance: 1,
  angle: 30,
  beamWidth: 2
});

var stdFilename = Scene.mktmp()+'.yml';
var std = Rx.Observable.fromNodeCallback(sh)([
  MK_STANDARD,
  board.edgeLength/board.numSquares,
  (board.numSquares-1),
  (board.numSquares-1),
  stdFilename
].join(' '),{silent:false}).map(function(){
  return stdFilename;
});

var images = Rx.Observable.range(0,30).flatMap(function(){
  var scene = Scene.mkRandom();
  return Rx.Observable.fromNodeCallback(scene.renderToFile.bind(scene))();
}).reduce(function(acc, f){
  return acc.concat([f]);
}, []);

var output = Scene.mktmp()+'.yml';

Rx.Observable.zip(std, images, function(std, images){
  var cmd = ([
    FIND_INTRINSICS,
    output,
    stdFilename,
    images.join(' ')
  ].join(' '));
  return Rx.Observable.fromNodeCallback(sh)(cmd,{silent:true});
}).flatMap(_.identity).map(function(){
  return fs.readFileSync(output).toString();
}).subscribe(console.log.bind(console,'\n<OUT>'));
