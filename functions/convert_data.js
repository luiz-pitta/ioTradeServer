'use strict';
/**
 * Módulo que faz retorna os sensores que estão próximos ao usuário
 *
 * @author Luiz Guilherme Pitta
 */
const sensorTag = require('../drivers/SensorTag');
const sensorTagCC2650 = require('../drivers/CC2650 SensorTag');

const db = require('../models/Connection');

/**
 * @return Retorna as informações dos serviços.
 */
exports.getConvertedData = (value, calibration, uuid, sensorName, macAddress, device) => 
	
	new Promise((resolve,reject) => {

		let data  = null;

		switch(sensorName) {
			case "SensorTag":
			    data = sensorTag.convert(value, calibration, uuid);
			    break;
			case "CC2650 SensorTag":
				data = sensorTagCC2650.convert(value, uuid);
			    break;
			case "f000aa21-0451-4000-b000-000000000000":
			    break;
			case "f000aa31-0451-4000-b000-000000000000":
			    break;
			case "f000aa41-0451-4000-b000-000000000000":
			    break;
			case "f000aa51-0451-4000-b000-000000000000":
			    break;
			default:
			    break;
		}

    	if(data != null){
			resolve({ status: 201, message: 'WORKED', sensorName: sensorName, uuid: uuid, data: data, macAddress: macAddress });
    	}
		else
			reject({ status: 500, message: 'Internal Server Error !' });

		
	});