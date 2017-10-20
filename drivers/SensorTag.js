/**
 * Module that the driver for SensorTag
 *
 * @author Luiz Guilherme Pitta
 */

'use strict';

const utilities = require('./utilities');

//Temperature
function extractAmbientTemperature(v) {
  	const offset = 2;
	return utilities.shortUnsignedAtOffset( v, offset ) / 128.0;
}

function extractTargetTemperature(v, ambient) {
 	let Vobj2 = utilities.shortSignedAtOffset( v, 0 );

	Vobj2 *= 0.00000015625;

	let Tdie = ambient + 273.15;

	let S0 = 5.593E-14; // Calibration factor
	let a1 = 1.75E-3;
	let a2 = -1.678E-5;
	let b0 = -2.94E-5;
	let b1 = -5.7E-7;
	let b2 = 4.63E-9;
	let c2 = 13.4;
	let Tref = 298.15;
	let S = S0 * (1 + a1 * (Tdie - Tref) + a2 * Math.pow((Tdie - Tref), 2));
	let Vos = b0 + b1 * (Tdie - Tref) + b2 * Math.pow((Tdie - Tref), 2);
	let fObj = (Vobj2 - Vos) + c2 * Math.pow((Vobj2 - Vos), 2);
	let tObj = Math.pow(Math.pow(Tdie, 4) + (fObj / S), .25);

	return tObj - 273.15;
}

function convertTemperature(value) {
	let temperature = []
	let ambient = extractAmbientTemperature( value );
	let target = extractTargetTemperature( value, ambient );
	temperature.push(ambient);
	temperature.push(target);
	return temperature;
}

//Accelerometer
function convertAccelerometer(value) {
	let accelerometer = [];
	accelerometer.push((value[0])/ 64.0);
	accelerometer.push((value[1])/ 64.0);
	accelerometer.push((value[2] * -1)/ 64.0);

	return accelerometer;
}

//Humidity
function convertHumidity(value) {
	let humidity = [];
	let a = utilities.shortUnsignedAtOffset( value, 2 );
	a = a - (a % 4);	

	humidity.push(((-6) + 125 * (a / 65535)));   

	return humidity;
}

//Magnetometer
function convertMagnetometer(value) {
	let magnetometer = [];

	let x = utilities.shortSignedAtOffset( value, 0 ) * (2000 / 65536) * -1;
	let y = utilities.shortSignedAtOffset( value, 2 ) * (2000 / 65536) * -1;
	let z = utilities.shortSignedAtOffset( value, 4 ) * (2000 / 65536);

	magnetometer.push(x);
	magnetometer.push(y);
	magnetometer.push(z);

	return magnetometer;
}

//Barometer
function convertBarometer(value, calibration) {
	let coefficients = setCalibrationData(calibration);
	let barometer = [];

	let t_r; // Temperature raw value from sensor
	let p_r; // Pressure raw value from sensor
	let S; // Interim value in calculation
	let O; // Interim value in calculation
	let p_a; // Pressure actual value in unit Pascal.

	t_r = utilities.shortSignedAtOffset( value, 0 );
	p_r = utilities.shortUnsignedAtOffset( value, 2 );

	S = coefficients[2] + coefficients[3] * t_r / Math.pow(2, 17) + ((coefficients[4] * t_r / Math.pow(2, 15)) * t_r) / Math.pow(2, 19);
	O = coefficients[5] * Math.pow(2, 14) + coefficients[6] * t_r / Math.pow(2, 3) + ((coefficients[7] * t_r / Math.pow(2, 15)) * t_r) / Math.pow(2, 4);
	p_a = (S * p_r + O) / Math.pow(2, 14);

	barometer.push(p_a);

	return barometer;
}

function setCalibrationData(value) {
	let coefficients = [0, 0, 0, 0, 0, 0, 0, 0];
	for( let i = 0; i < 4; ++i ) {
		coefficients[i] = utilities.shortUnsignedAtOffset( value, i * 2 );
		coefficients[i + 4] = utilities.shortSignedAtOffset( value, 8 + i * 2 );
	}
	return coefficients;
}

//Gyroscope
function convertGyroscope(value) {
	let gyroscope = [];

	let y = utilities.shortSignedAtOffset( value, 0 ) * (500 / 65536) * -1;
	let x = utilities.shortSignedAtOffset( value, 2 ) * (500 / 65536);
	let z = utilities.shortSignedAtOffset( value, 4 ) * (500 / 65536);

	gyroscope.push(x);
	gyroscope.push(y);
	gyroscope.push(z);

	return gyroscope;
}

exports.convert = function(value, calibration, uuid) {
	switch(uuid) {
		case "f000aa01-0451-4000-b000-000000000000":
		    return convertTemperature(value);
		case "f000aa11-0451-4000-b000-000000000000":
		    return convertAccelerometer(value);
		case "f000aa21-0451-4000-b000-000000000000":
		    return convertHumidity(value);
		case "f000aa31-0451-4000-b000-000000000000":
		    return convertMagnetometer(value);
		case "f000aa41-0451-4000-b000-000000000000":
		    return convertBarometer(value, calibration);
		case "f000aa51-0451-4000-b000-000000000000":
		    return convertGyroscope(value);
		default:
		    return null;
	}
};