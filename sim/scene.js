require('sylvester');
var _ = require('lodash');
var fs = require('fs');
var os = require('os');
var uuid = require('uuid');
var path = require('path');
var sh = require('shelljs');

function Scene(opts){
  this.lasers = opts.lasers;
  this.board = opts.board;
  this.position = opts.position || $V([0,0,8]);
}

Scene.header = fs.readFileSync('sceneHeader.tpl');

_.assign(Scene.prototype, {
  toPOVRay: function(){
    return [
      Scene.header,
      this.lasers.toPOVRay(this.position).join('\n'),
      this.board.toPOVRay()
    ].join('\n');
  },
  renderToFile: function(cb){
    var src = this.toPOVRay();
    console.log('===== SRC =====');
    console.log(src);
    console.log('===== END SRC =====');
    var fnm = path.join(os.tmpdir(), uuid.v4());
    var srcFnm = fnm+'.pov';
    var imgFnm = fnm+'.png';
    var cmd = ['povray', '+O"'+imgFnm+'"', '-D', srcFnm];
    fs.writeFileSync(srcFnm, src);
    sh.exec(cmd.join(' '), {silent: false}, function(code){
      if(code){
        return cb(new Error('povray exited with code '+code));
      }
      cb(null, imgFnm);
    });
  }
});

module.exports = Scene;
