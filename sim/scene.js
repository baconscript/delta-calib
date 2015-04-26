require('sylvester');
var _ = require('lodash');
var fs = require('fs');
var os = require('os');
var uuid = require('uuid');
var path = require('path');
var sh = require('shelljs');
var Chessboard = require('./chessboard');

function Scene(opts){
  this.lasers = opts.lasers;
  this.board = opts.board;
  this.position = opts.position || $V([0,0,8]);
  this.cameraPosition = opts.cameraPosition || $V([0,-3,1]);
  this.fov = opts.fov || 75;
  this.imageWidth = opts.imageWidth || 1024;
  this.imageHeight = opts.imageHeight || 768;
  this.lookAt = opts.lookAt || Scene.ORIGIN;
}

Scene.header = _.template(fs.readFileSync('sceneHeader.tpl'));
Scene.ORIGIN = $V([0,0,0]);

_.assign(Scene.prototype, {
  toPOVRay: function(){
    return [
      Scene.header({
        cam: this.cameraPosition,
        fov: this.fov,
        lookAt: this.lookAt
      }),
      this.lasers ? this.lasers.toPOVRay(this.position).join('\n') : '',
      this.board.toPOVRay()
    ].join('\n');
  },
  renderToFile: function(cb){
    var src = this.toPOVRay();
    var fnm = path.join(os.tmpdir(), uuid.v4());
    var srcFnm = fnm+'.pov';
    var imgFnm = fnm+'.png';
    var cmd = [
      'povray', 
      '+O"'+imgFnm+'"', 
      '+W'+this.imageWidth,
      '+H'+this.imageHeight,
      '-D', srcFnm];
    fs.writeFileSync(srcFnm, src);
    sh.exec(cmd.join(' '), {silent: true}, function(code){
      if(code){
        return cb(new Error('povray exited with code '+code));
      }
      cb(null, imgFnm);
    });
  }
});

Scene.mkRandom = function(opts){
  opts = opts || {};
  var board = opts.board || new Chessboard({
    edgeLength: 4,
    numSquares: 12
  });
  var rando = $V([
      Math.random()*10-5,
      Math.random()*10-5,
      6
    ]);
  return new Scene(_.defaults(opts,{
    board: board,
    cameraPosition: rando
  }));
};

module.exports = Scene;
