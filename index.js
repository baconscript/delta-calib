require('coffee-script/register');
//var gpio = require('pi-gpio');
//var RaspiCam = require('raspicam');
var Rx = require('rx');
var _ = require('lodash');
var program = require('commander');
var package = require('./package');
require('sylvester');
var SerialPort = require('serialport').SerialPort;

// pins 16, 18, 22 are the lasers
var LASER_PINS = [16,18,22];

// take 12 pics before calculating camera intrinsics
var NUM_INTRINSIC_PICS = 12;

function LaserManager(opts){
  this.laserPins = opts.laserPins;
}

_.assign(LaserManager.prototype, {
  // ### takeLaserPics :: (CameraManager, Rx.Observable<Any>) -> Rx.Observable<LaserPic>
  takeLaserPics: function(cameraManager, trigger){

    var laserPics = new Rx.Subject();

    trigger.subscribe(function(/* ignore stream value */){
      var lasers = Rx.Observable.from(this.laserPins);
      var lasersQueue = new Rx.Subject();
    }.bind(this));
    
    return laserPics;
  }
});

function CameraManager(opts){
}

_.assign(CameraManager.prototype, {
});

var LOC_EPSILON = 1e-3;

function PrinterManager(opts){
  opts = opts || {};
  this.port = new SerialPort(opts.port, {
    baudrate: opts.baud
  }, false);
  this._outputLines = new Rx.Subject();
  this.openPort();

  if(opts.log){
    this._outputLines.tap(console.log.bind(console));
  }

  this.checkLocationInterval = opts.checkLocationInterval || 500;
  this._intervals = {};
  this._intervals.checkLocation = setInterval(
      this._checkLocation.bind(this), this.checkLocationInterval);
  this._location = new Rx.Subject();
}

/*
 * ```
 * data LaserPositionPic = LaserPositionPic {
 *   intendedPosition :: Position,
 *   image :: LaserPic
 * }
 * ```
 */

_.assign(PrinterManager.prototype, {

  // ### openPort :: () -> ()
  openPort: function(){
    this.port.open(function(err){
      if(err){
        console.error('Failed to open port '+opts.port+' at baudrate '+opts.baud);
        err.printStackTrace();
        return;
      }
      Rx.Observable.fromEvent(this.port, 'data').scan({events: [], buf: ''}, function(acc, x){
        acc = _.clone(acc);
        acc.buf += x;
        var lines = acc.buf.split('\n').filter(_.identity);
        return {
          events: lines.slice(0,lines.length-1),
          buf: lines[lines.length-1] || ''
        };
      }).flatMap(function(acc){
        return Rx.Observable.from(acc.events);
      }).subscribe(function(line){
        this._outputLines.onNext(line);
      }.bind(this));
    }.bind(this));
  },

  // ### moveToPositionsAndTakeLaserPics :: (Rx.Observable<Position>, LaserManager, CameraManager) -> Rx.Observable<LaserPositionPic>
  moveToPositionsAndTakeLaserPics: function(positions, laserManager, cameraManager){
    // laserPics :: Rx.Observable<LaserPositionPic>
    var laserPics = new Rx.Subject();

    // positionsQueue :: Rx.Subject<Position, LaserPositionPic>
    var positionsQueue = new Rx.Subject();

    // Give `positionsQueue` a new position after every laser pic.
    Rx.Observable

      // Pair off each outgoing laser pic with an incoming position, but skip the first
      // position since we will have already processed it by the time we get a pic.
      .zip(laserPics, positions.skip(1), function(pic, position){return position;})

      // Merge in the first position to kick off the process.
      .merge(positions.take(1))
      .subscribe(function(position){
        // moved :: Rx.Observable<Position>
        var moved = this.moveTo(position);

        // plainPix :: Rx.Observable<LaserPic>
        var plainPix = laserManager.takeLaserPics(cameraManager, moved);

        // after the print head moves, push the next one into the queue
        moved.subscribe(function(position){
          positionsQueue.onNext(position);
        });

        // link the images with the print head location
        plainPix.subscribe(function(pic){
          laserPics.onValue({intendedPosition: position, image: pic});
        });
      });

    // sneaky cast to Observable so we're not exposing the Subject
    return laserPics.map(_.identity);
  },
  output: function(){
    return this._outputLines.map(_.identity);
  },
  location: function(){
    return this._location.map(_.identity);
  },

  _moveTo: function(position){
    this._sendGcode("G0 "+_.range(1,3).map(function(i){return position.e(i)}).join(' '));
  },

  // ### moveTo :: (Position, Number) -> Rx.Observable<Position>
  moveTo: function(desiredPosition, epsilon){
    epsilon = epsilon || LOC_EPSILON;
    this._moveTo(desiredPosition);
    return this.location().takeWhile(function(actual){
      return desiredPosition.distanceFrom(actual) > epsilon;
    }).takeLast(1);
  },
  _home: function(){
    this._sendGcode("G28");
  },
  _checkLocation: function(){
    this._sendGcode('M114');
  },
  _sendGcode: function(gcode){
    // TODO
  },
  _destroy: function(){
    clearInterval(this._intervals.checkLocation);
  }
});

function range(val) {
  return val.split('..').map(Number);
}
 
function list(val) {
  return val.split(',');
}

function numList(val){
  return list(val).map(Number);
}

program
  .version(package.version)
  .option('-P, --port <port>', 'Set port for connecting to printer', String)
  .option('-B, --baud <rate>', 'Set baudrate for connecting to printer', Number)
  .option('-z, --z-range <low>..<high>', 'Set the range of Z-values', range)
  .option('-Z, --z-step <step>', 'Set Z stepping value in mm', Number)
  .option('-p, --laser-pins <pins>', 'Set which pins to use for lasers', numList)
  .option('-d, --delta-x-y <value>', 'Set the amount to move in x and y between each test (mm)', Number)
  .option('-b, --print-bed-size <value>', 'Set the size of the print bed in mm', Number)
  .option('-s, --square-size <value>', 'Set chessboard square size in mm', Number)
  .option('-n, --board-size <x>,<y>', 'Set x,y size of chessboard in squares', numList)
  .option('-i, --intrinsic-pics <value>', 'Set number of images to take before calculating intrinsics', Number)
  .option('-I, --intrinsic-matrix <filename>', "Don't calculate intrinsics; instead load from file")
  .option('-S, --sim', 'Use simulation (must use this if not on a Raspberry Pi)')
  .parse(process.argv);

var zRange = program.zRange;
if(zRange[1] > zRange[0]) {
  zRange = [zRange[1], zRange[0]];
}

var Z_STEP = -Math.abs(program.zStep || 20);
var Z_VALUES = _.range(zRange[0], zRange[1], Z_STEP);

var zHeads = Rx.Observable.from(Z_VALUES);
var headPositions = zHeads.map(function(z){
  return $V([0,0,z]);
});
headPositions.subscribe(console.log.bind(console));
