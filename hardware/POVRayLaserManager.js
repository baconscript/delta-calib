var LaserManager = require('./LaserManager');
var Rx = require('rx');
var _ = require('lodash');
var sh = require('shelljs').exec();
var Scene = require('../sim/scene');

function POVRayLaserManager(opts){
  // connect the LaserManager behavior
  LaserManager.apply(this, arguments);
  // override the write behavior
  this._pinStates = {};
}

_.assign(POVRayLaserManager.prototype, {
  initialize: function(opts){
    opts = opts || {};
    if(!opts.scene){
      throw new Error("Need to pass a Scene into POVRayLaserManager");
    }
    LaserManager.initialize.apply(this,arguments);
    var openPin = Rx.Observable.fromNodeCallback(gpio.open);
    var done = Rx.Observable.from(this.laserPins).flatMap(function(pin){
      return openPin(pin, 'output');
    }).last();
    return done;
  },
  _write: function(pin, level){
    this._pinStates[pin] = level;
    return Rx.Observable.of(this._pinStates);
  },
  _destroy: function(){
  }
});

module.exports = POVRayLaserManager;
