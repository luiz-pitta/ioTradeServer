'use strict';
/**
 * Módulo que faz retorna as informações de todos os sensores 
 *
 * @author Luiz Guilherme Pitta
 */

const db = require('../models/Connection');

/**
 * Módulo para assertivas
 */
const chai = require('chai'); 
const assert = chai.assert; 

/**
 * @return Retorna as informações dos sensores.
 */
exports.getSensorPriceInformation = () => 
	
	new Promise((resolve,reject) => {

		let sensorPriceArray =[];

		const cypher = "MATCH (s:Sensor)-[r:IS_IN]->(g:Group) "
					+"RETURN s, r.price, g.title ORDER BY s.title";

		db.cypher({
		    query: cypher,
		    lean: true
		}, (err, results) =>{

			try{
				assert.notExists(err, 'Sem erro!');
			}catch(err){
				console.log(err.message);
			}

			if (err) 
		    	reject({ status: 500, message: 'Internal Server Error !' });
		    else{

		    	try{
					assert.isDefined(results, 'Vetor Existe!');
				}catch(err){
					console.log(err.message);
				}

		    	results.forEach(function (obj) {
		            let s = obj['s'];
		            const price_sensor = obj['r.price'];
		            const title_group = obj['g.title'];

		            s.category = title_group;
		            s.price = price_sensor;

		            sensorPriceArray.push(s);
		        });
		        
		        try{
					assert.exists(sensorPriceArray, 'Vetor Existe!');
				}catch(err){
					console.log(err.message);
				}

				resolve({ status: 201, sensorPriceArray: sensorPriceArray });
		    }
		    
		});

	});


/**
 * @return Retorna as informações dos sensores.
 */
exports.getConnectPriceInformation = (device) => 
	
	new Promise((resolve,reject) => {

		let price;

		const cypher = "MATCH (c:Connection {device:{device}})-[r:IS_IN]->(g:Group) "
					+"RETURN r.price ";

		db.cypher({
		    query: cypher,
		    params: {
		        device: device
		    },
		    lean: true
		}, (err, results) =>{

			if (err) 
		    	reject({ status: 500, message: 'Internal Server Error !' });
		    else{

		    	results.forEach(function (obj) {
		            const c = obj['r.price'];
		            price = c;  
		        });

		    	resolve({ status: 201, message: 'WORKED', price: price });
		    }
		});

	});