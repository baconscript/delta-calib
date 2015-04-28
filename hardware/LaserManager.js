var _ = require('lodash');
var Rx = require('rx');

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

LaserManager.laserConfigsSame = laserConfigsSame;
LaserManager.getOnLaser = getOnLaser;
LaserManager.toLaserConfig = toLaserConfig;
LaserManager.toOnLaserConfig = toOnLaserConfig;
LaserManager.mergeLaserState = mergeLaserState;


_.assign(LaserManager.prototype, {
  initialize: function(){
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
    }.bind(this));
  },
  getLasers: function(){
    return this._laserStateRollup.map(_.identity);
  },
  _destroy: function(){
  },
  _write: function(pin, level){
    throw new Error("Must override LaserManager._write(pin, level) in "+this.constructor.name);
  }

});


module.exports = LaserManager;
