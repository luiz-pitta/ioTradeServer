'use strict';

const utilities = require('./utilities');

//Temperature
function extractAmbientTemperature(v) {
  	const offset = 2;
	return utilities.shortUnsignedAtOffset( v, offset ) / 128.0;
}

function extractTargetTemperatureTMP007(v) {
	let offset = 0;
	return utilities.shortUnsignedAtOffset(v, offset) / 128.0;
}

function convertTemperature(value) {
	let temperature = []
	let ambient = extractAmbientTemperature( value );
	let targetNewSensor = extractTargetTemperatureTMP007(value);
	temperature.push(ambient);
	temperature.push(targetNewSensor);
	return temperature;
}

//Moviment
function convertMovement(value) {
	let accelerometer;
	let gyroscope;
	let magnetometer;

	accelerometer = convertAccelerometer(value);
	gyroscope = convertGyroscope(value);
	magnetometer = convertMagnetometer(value);

	let final = accelerometer.concat(gyroscope);
	final = final.concat(magnetometer);

	return final;
}

function convertAccelerometer(value) {
	let accelerometer = []

	// Range 8G
	let SCALE = 4096.0;

	let x = (value[7]<<8) + value[6];
	let y = (value[9]<<8) + value[8];
	let z = (value[11]<<8) + value[10]; 

	accelerometer.push( ((x / SCALE) * -1) );
	accelerometer.push( y / SCALE);
	accelerometer.push( ((z / SCALE) * -1) );

	return accelerometer;
}

function convertGyroscope(value) {
	let gyroscope = [];

	let SCALE = 128.0;

	let x = (value[1]<<8) + value[0];
	let y = (value[3]<<8) + value[2];
	let z = (value[5]<<8) + value[4]; 

	gyroscope.push(x / SCALE);
	gyroscope.push(y / SCALE);
	gyroscope.push(z / SCALE);

	return gyroscope;
}

function convertMagnetometer(value) {
	let magnetometer = [];

	let SCALE = (32768 / 4912);



	if (value.length >= 18) {
		let x = (value[13]<<8) + value[12];
		let y = (value[15]<<8) + value[14];
		let z = (value[17]<<8) + value[16]; 

		magnetometer.push(x / SCALE);
		magnetometer.push(y / SCALE);
		magnetometer.push(z / SCALE);

		return magnetometer;
	}else{
		magnetometer.push(0);
		magnetometer.push(0);
		magnetometer.push(0);
		return magnetometer;
	}
}

//Humidity
function convertHumidity(value) {
	let humidity = [];
	let a = utilities.shortUnsignedAtOffset( value, 2 );

	humidity.push(100 * (a / 65535));   

	return humidity;
}

//Barometer
function convertBarometer(value) {
	let barometer = [];

	if (value.length > 4) {
		let val = utilities.twentyFourBitUnsignedAtOffset(value, 2);
		barometer.push(val/100);

		return barometer;
    }else {
		let mantissa;
		let exponent;
		let sfloat = utilities.shortUnsignedAtOffset(value, 2);

		mantissa = sfloat & 0x0FFF;
		exponent = (sfloat >> 12) & 0xFF;

		let output;
		let magnitude = Math.pow(2, exponent);
		output = (mantissa * magnitude);

		barometer.push(output/100);

		return barometer;
    }
}

//Optical
function convertOptical(value) {
	let optical = [];

	let mantissa;
	let exponent;
	let sfloat = utilities.shortUnsignedAtOffset(value, 0);

	mantissa = sfloat & 0x0FFF;
	exponent = (sfloat >> 12) & 0xFF;

	let output;
	let magnitude = Math.pow(2, exponent);
	output = (mantissa * magnitude);

	optical.push(output);

	return optical;
}

exports.convert = function(value, uuid) {
	switch(uuid) {
		case "f000aa01-0451-4000-b000-000000000000":
		    return convertTemperature(value);
		case "f000aa21-0451-4000-b000-000000000000":
		    return convertHumidity(value);
		case "f000aa41-0451-4000-b000-000000000000":
		    return convertBarometer(value);
		case "f000aa81-0451-4000-b000-000000000000":
		    return convertMovement(value);
		case "f000aa71-0451-4000-b000-000000000000":
		    return convertOptical(value);
		default:
		    return null;
	}
};