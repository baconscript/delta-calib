var gpio = require('pi-gpio');

var pins = [16,18,22];

function close(pin){
	gpio.close(pin, function(){
		console.log('Closed '+pin);
	});
}

pins.forEach(close);
