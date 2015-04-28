require('sylvester');
var _ = require('lodash');
var fs = require('fs');
var path = require('path');

function LaserMount(opts){
  this.distance = opts.distance;
  this.angle = opts.angle;
  this.beamWidth = opts.beamWidth || 0.1;
}

LaserMount.laserMountTpl = _.template(fs.readFileSync(path.join(__dirname,'laserMount.tpl')));

_.assign(LaserMount.prototype, {
  laserTransforms: function(states){
    var show;
    if(_.isArray(states)){
      show = function(i){ return _.contains(states, i); };
    } else if(_.isPlainObject(states)){
      show = function(i){ return Boolean(states[i])};
    } else {
      show = _.constant(true);
    }
    var tpl = _.template('rotate x * <%- angle %> translate z * <%- distance %> rotate y * <%- armAngle %>');
    return _.range(0,3).filter(show).map(function(i){
      var data = {
        angle: this.angle,
        distance: this.distance,
        armAngle: i*120
      };
      return tpl(data);
    }.bind(this));
  },
  toPOVRay: function(pos, states){
    return this.laserTransforms(states).map(function(tf){
      return LaserMount.laserMountTpl({
        x: -pos.e(1),
        y: pos.e(3),
        z: pos.e(2),
        beamWidth: this.beamWidth,
        tf: tf
      });
    }.bind(this));
  }
});

module.exports = LaserMount;
