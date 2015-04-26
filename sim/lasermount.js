require('sylvester');
_ = require('lodash');
fs = require('fs');

function LaserMount(opts){
  this.distance = opts.distance;
  this.angle = opts.angle;
}

LaserMount.laserMountTpl = _.template(fs.readFileSync('laserMount.tpl'));

_.assign(LaserMount.prototype, {
  laserTransforms: function(){
    var tpl = _.template('rotate x * <%- angle %> translate z * <%- distance %> rotate y * <%- armAngle %>');
    return _.range(0,3).map(function(i){
      var data = {
        angle: this.angle,
        distance: this.distance,
        armAngle: i*120
      };
      return tpl(data);
    }.bind(this));
  },
  toPOVRay: function(pos){
    return this.laserTransforms().map(function(tf){
      return LaserMount.laserMountTpl({
        x: -pos.e(1),
        y: pos.e(3),
        z: pos.e(2),
        tf: tf
      });
    });
  }
});

module.exports = LaserMount;
