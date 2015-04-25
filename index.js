require('coffee-script/register');
var gpio = require('pi-gpio');
//var RaspiCam = require('raspicam');
var Rx = require('rx');
var _ = require('lodash');
var program = require('commander');
var package = require('./package');
require('sylvester');
var spp = require('serialport');
var SerialPort = spp.SerialPort;

// pins 16, 18, 22 are the lasers
var LASER_PINS = [16,18,22];

// take 12 pics before calculating camera intrinsics
var NUM_INTRINSIC_PICS = 12;

function LaserManager(opts){
  this.laserPins = opts.laserPins;
  this._laserState = new Rx.Subject();
  this._laserStateRollup = this._laserState.scan({}, function(acc, x){
    acc = _.clone(acc);
    _.keys(x).forEach(function(key){
      acc[key] = Boolean(x[key]);
    });
    return acc;
  });
  this._write = Rx.Observable.fromNodeCallback(gpio.write);
}

/* ```
 * type LaserID = Int
 *
 * data LaserPic = LaserPic {
 *   laser :: LaserID,
 *   image :: Image
 * }
 * ```
 */

function laserConfigsSame(a, b){
  var keys = _.uniq(_.keys(a).concat( _.keys(b)));
  return _.all(keys, function(key){
    return Boolean(a[key]) === Boolean(b[key]);
  });
}

function getOnLaser(a){
  return _.keys(a).filter(function(k){
    return a[k];
  })[0];
}

function toLaserConfig(pin, value){
  var x = {};
  x[pin] = value;
  return x;
}

function toOnLaserConfig(pin){
  return toLaserConfig(pin, true);
}

function mergeLaserState(oldState, newState){
  return _.defaults(_.clone(newState), oldState);
}

_.assign(LaserManager.prototype, {
  initialize: function(){
    var openPin = Rx.Observable.fromNodeCallback(gpio.open);
    var done = Rx.Observable.from(this.laserPins).flatMap(function(pin){
      if(program.verbose) console.log(' [LASER] Opening '+pin);
      return openPin(pin, 'output');
    }).last();
    return done;
  },
  // ### takeLaserPics :: (CameraManager, Rx.Observable<Any>) -> Rx.Observable<LaserPic>
  takeLaserPics: function(cameraManager, trigger){
    // Giant leap of faith here: we're assuming that `trigger` will produce exactly
    // one value at a time and will not produce a new value until we've produced
    // an event in the output stream. I've got some conceptual work to do here.

    var pics = new Rx.Subject();
var n = 0;


    trigger.subscribe(function(/* don't care */){
      var laserSettings = Rx.Observable.from(([{}]).concat(this.laserPins.map(toOnLaserConfig)));
      var innerPix = new Rx.Subject();
      Rx.Observable.zip(laserSettings.skip(1), innerPix, function(set,pic){return set})
        .merge(laserSettings.take(1))
        .flatMap(function(setting){
          return this.setLasers(setting);
        }.bind(this)).subscribe(function(setting){
          console.log(setting);
          setTimeout(innerPix.onNext.bind(innerPix,n++), 500);
        }, function(err){
          innerPix.onNext(err);
        }, function(){innerPix.onCompleted()});
      innerPix.reduce(function(acc, next){ return acc.concat([next])}, []).last().subscribe(function(pix){
        pics.onNext(pix);
      });
    }.bind(this));
    
    return pics;
  },
  setLasers: function(conf){
    this._setLasers(conf);
    return this.getLasers().skipWhile(function(actual){
      return !laserConfigsSame(conf, actual);
    }).take(1);
  },
  _setLasers: function(conf){
    this.laserPins.forEach(function(pin){

      var value = conf[pin]? 1: 0;
      var writes = this._write(pin, value).map(function(){
        return toLaserConfig(pin, value);
      }).subscribe(function(config){
        this._laserState.onNext(config);
      }.bind(this));

      //Rx.Observable.zip(writes, this._laserState.sample(writes), mergeLaserState)
        //.subscribe(function(state){
          //this._laserState.onNext(state);
        //});

    }.bind(this));
  },
  getLasers: function(){
    return this._laserStateRollup.map(_.identity);
  },
  _destroy: function(){
    return Rx.Observable.merge(Rx.Observable.from(this.laserPins).flatMap(function(pin){
      return Rx.Observable.fromNodeCallback(gpio.close)(pin);
    })).map(_.constant(true)).takeLast(1);
  }
});

function CameraManager(opts){
}

_.assign(CameraManager.prototype, {
  capture: function(trigger){
    var caps = new Rx.Subject();
    setTimeout(function(){
      caps.onNext("Click!");
    }, 1000);
    return caps.map(_.identity);
  }
});

var LOC_EPSILON = 1e-3;

function PrinterManager(opts){
  opts = opts || {};
  this.port = new SerialPort(opts.port, {
    baudrate: opts.baud
  }, false);
  this._outputLines = new Rx.Subject();
  this._echo = new Rx.Subject();
  this.openPort(opts.callback || function(){});

  if(opts.log){
    this._outputLines.tap(console.log.bind(console));
  }

  this.checkLocationInterval = opts.checkLocationInterval || 2000;
  this._intervals = {};
  this._intervals.checkLocation = setInterval(
      this._checkLocation.bind(this), this.checkLocationInterval);
  this._setUpLocation();
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

  // ### openPort :: ( (Error) -> () ) -> ()
  openPort: function(cb){
    this.port.open(function(err){
      if(err){
        cb(err);
        console.error('Failed to open port '+opts.port+' at baudrate '+opts.baud);
        err.printStackTrace();
        return;
      }
      var dataline = Rx.Observable.fromEvent(this.port, 'data')
	.scan({events: [], buf: ''}, function(acc, x){
        acc = _.clone(acc);
	var buff = acc.buf.toString() + x.toString();
        var lines = buff.split(/\n/g);
        return {
          events: lines.slice(0,lines.length-1),
          buf: lines[lines.length-1] || ''
        };
      }).flatMap(function(acc){
        return Rx.Observable.from(acc.events);
      });

      dataline.take(1).subscribe(function(){cb()});

      dataline.subscribe(function(line){
        this._outputLines.onNext(line);
        if(program.verbose) console.log(' [DATA] >> '+line);
      }.bind(this));

      this.output().map(function(line){
        return (line.match(/echo:\s*(.+)$/i)||[])[1];
      }).filter(_.identity).subscribe(function(line){
        this._echo.onNext(line);
      }.bind(this));
    }.bind(this));
  },

  _setUpLocation: function(){
    this._location = new Rx.Subject();
    this._outputLines.map(function(line){
      return line.match(/X:(\d*(?:\.\d+)?) Y:(\d*(?:\.\d+)?) Z:(\d*(?:\.\d+)?)/);
    }).filter(_.identity).map(function(list){
      return $V([+list[1], +list[2], +list[3]]);
    }).subscribe(function(location){
      this._location.onNext(location);
    }.bind(this));
  },

  // ### moveToPositionsAndTakeLaserPics :: (Rx.Observable<Position>, LaserManager, CameraManager) -> Rx.Observable<LaserPositionPic>
  moveToPositionsAndTakeLaserPics: function(positions, laserManager, cameraManager){
    var pics = new Rx.Subject();
    var n = 0;
    var controlledPositions = Rx.Observable.zip(positions.skip(1), pics, function(pos, pic){return pos})
      .merge(positions.take(1))
      .flatMap(function(pos){
        return this.moveTo(pos);
      }.bind(this));
    var outpics = laserManager.takeLaserPics(cameraManager, controlledPositions);
    outpics.subscribe(function(){ pics.onNext('ok') });
    return outpics;
  },
  output: function(){
    return this._outputLines.map(_.identity);
  },
  location: function(){
    return this._location.map(_.identity);
  },
  echo: function(){
    return this._echo.map(_.identity);
  },

  _moveTo: function(position){
    var labels = ['','X','Y','Z'];
    this._sendGcode("G0 "+([1,2,3]).map(function(i){return labels[i] + position.e(i)}).join(' '));
  },

  // ### moveTo :: (Position, Number) -> Rx.Observable<Position>
  moveTo: function(desiredPosition, epsilon){
    epsilon = epsilon || LOC_EPSILON;
    this._moveTo(desiredPosition);
    return this.location().map(function(actual){
      return {dist: desiredPosition.distanceFrom(actual), pos: actual};
    }).skipWhile(function(d){
      return d.dist > epsilon;
    }).map(function(d){
      return d.pos;
    }).take(1);
  },
  _home: function(){
    this._sendGcode("G28");
  },
  _checkLocation: function(){
    this._sendGcode('M114');
  },
  _sendGcode: function(gcode){
    if(program.verbose) console.log(' [SEND] >> '+gcode);
    if(!(/\n$/.test(gcode))){
      gcode += '\n';
    }
    this.port.write(gcode);
  },
  _destroy: function(cb){
    clearInterval(this._intervals.checkLocation);
    this.port.close(cb);
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
  .option('-L, --list-ports', 'List ports and exit')
  .option('-z, --z-range <low>..<high>', 'Set the range of Z-values', range)
  .option('-Z, --z-step <step>', 'Set Z stepping value in mm', Number)
  .option('-p, --laser-pins <pins>', 'Set which pins to use for lasers', numList)
  .option('-d, --delta-x-y <value>', 'Set the amount to move in x and y between each test (mm)', Number)
  .option('-b, --print-bed-size <value>', 'Set the size of the print bed in mm', Number)
  .option('-s, --square-size <value>', 'Set chessboard square size in mm', Number)
  .option('-n, --board-size <x>,<y>', 'Set x,y size of chessboard in squares', numList)
  .option('-i, --intrinsic-pics <value>', 'Set number of images to take before calculating intrinsics', Number)
  .option('-v, --verbose', 'Verbose mode')
  //.option('-I, --intrinsic-matrix <filename>', "Don't calculate intrinsics; instead load from file")
  //.option('-S, --sim', 'Use simulation (must use this if not on a Raspberry Pi)')
  .parse(process.argv);

var zRange = program.zRange || [200,100];
if(zRange[1] > zRange[0]) {
  zRange = [zRange[1], zRange[0]];
}

var Z_STEP = -Math.abs(program.zStep || 20);
var Z_VALUES = _.range(zRange[0], zRange[1], Z_STEP);

var zHeads = Rx.Observable.from(Z_VALUES);
var headPositions = zHeads.map(function(z){
  return $V([0,0,z]);
});

function takeLaserPicsAtPositions(positionList, printer, lasers, camera){
  var positions = Rx.Observable.from(positionList);
  var pauser = new Rx.Subject();
  var laserPics = new Rx.Subject();
}

if(program.listPorts){
  spp.list(function(err, ports){
    if(err){
      return console.error(err);
    }
    ports.forEach(function(port){
      console.log(port.comName);
    });
  });
} else {
  var camera = new CameraManager({
  });
  var lasers = new LaserManager({
    laserPins: LASER_PINS
  });
  var printerReady = new Rx.Subject();
var printer;
  lasers.initialize().subscribe(function(){
    printer = new PrinterManager({
      port: program.port,
      baud: program.baud,
      callback: function(){
        if(program.verbose) console.log('Connected to printer');
        printer._home();
        printer.moveToPositionsAndTakeLaserPics(headPositions, lasers, camera).subscribe(console.log.bind(console,'PIC'), function(){}, function(){printer._home()});
      }
    });
    lasers.setLasers({
      16: true,
      18: true,
      22: true
    });
  });
  process.on('SIGINT', function() {
    console.log("Caught interrupt signal, cleaning up");

    printer._destroy(function(){
      lasers._destroy().subscribe(function(){
        process.exit();
      });
    });
});
}
