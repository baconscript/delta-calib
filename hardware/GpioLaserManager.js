var LaserManager = require('./LaserManager');
var gpio = require('pi-gpio');
var Rx = require('rx');
var _ = require('lodash');

function GpioLaserManager(opts){
  // connect the LaserManager behavior
  LaserManager.apply(this, arguments);
  // override the write behavior
  this._write = Rx.Observable.fromNodeCallback(gpio.write);
}

_.assign(GpioLaserManager.prototype, {
  initialize: function(){
    LaserManager.initialize.apply(this,arguments);
    var openPin = Rx.Observable.fromNodeCallback(gpio.open);
    var done = Rx.Observable.from(this.laserPins).flatMap(function(pin){
      return openPin(pin, 'output');
    }).last();
    return done;
  },
  _destroy: function(){
    return Rx.Observable.merge(Rx.Observable.from(this.laserPins).flatMap(function(pin){
      return Rx.Observable.fromNodeCallback(gpio.close)(pin);
    })).map(_.constant(true)).takeLast(1);
  }
});

module.exports = GpioLaserManager;
