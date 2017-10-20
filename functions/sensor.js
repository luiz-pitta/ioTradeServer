'use strict';
/**
 * Module that runs the matchmaking algorithm
 *
 * @author Luiz Guilherme Pitta
 */

const db = require('../models/Connection');

/**
 * Assertive module
 */
const chai = require('chai'); 
const assert = chai.assert;  

/**
 * @param min Minimum number.
 * @param max Maximum number.
 * @return Returns a random number between the {min, max} received as parameter
 */
function randomIntFromInterval(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}

/**
 * @return Returns services without analytics of the matchmaking algorithm.
 */
exports.getSensorAlgorithm = (lat, lng, category, radius, connection_device) => 
	
	new Promise((resolve,reject) => {

		let sensors;
		let connects =[];
		let sens =[];
		let connect_chosen;
		let sensor_chosen;

		const cypher = "MATCH (g:Group)<-[sr:IS_IN]-(s:Sensor)<-[:IS_FROM]-(sc:SensorChild)"
				+"WHERE sc.macAddress IN {sens} "
				+"WITH s, sr, g, sc "

				+"MATCH (cn:Connection)-[cnr:IS_IN]->(g2:Group), (you:Profile), (s)-[r:BELONGS_TO]->(c:Category {title: {category}}) "
				+"WHERE cn.device IN {connects} AND (sr.price + cnr.price) <= you.budget "

				+"WITH cn, s, sr, cnr, g, g2, sc, r  ORDER BY sr.sum/sr.qty DESC, sr.price "

				+"RETURN cn, cnr, g2.title, collect({s:s,sr:sr,g:g.title,r:r,sc:sc.macAddress})[0..5] as sens ORDER BY cnr.sum/cnr.qty DESC, cnr.price, cn.signal DESC, cn.batery DESC ";

		const cypher_con = "MATCH (you:Profile)"
				+ "MATCH (s:Sensor)-[sr:IS_IN]->(g:Group) "
				+ "WITH toFloat(you.budget - min(sr.price)) as min_price "

				+ "MATCH (cn:Connection) WHERE cn.signal >= 3 AND cn.batery >= 30 AND (NOT cn.device IN {connection_device}) "
				+ "WITH sin(radians(cn.lat-({lat}))/2)*sin(radians(cn.lat-({lat}))/2) + "
				+ "sin(radians(cn.lng-({lng}))/2)*sin(radians(cn.lng-({lng}))/2)* "
				+ "cos(radians({lat}))*cos(radians(cn.lat)) as d, cn, min_price "

				+ "WITH 6371*2*atan2(sqrt(d), sqrt(1-d)) as da, cn, min_price "
				+ "WHERE da < {radius}  WITH cn, min_price ORDER BY cn.signal DESC, cn.batery DESC "

				+ "MATCH (g:Group)<-[cnr:IS_IN]-(cn)-[:IS_CONNECTED_TO]->(c:Category {title:{category}}) "
				+ "WHERE cnr.price < min_price "

				+ "RETURN g.title, collect(cn)[0..1] as cons";

		const cypher_sens = "MATCH (g:Group)<-[sr:IS_IN]-(s:Sensor)-[:BELONGS_TO]->(c:Category {title: {category}})  "
				+"MATCH (cn:Connection)-[:IS_NEAR]->(sc:SensorChild)-[:IS_FROM]->(s) "
				+"WHERE cn.device IN {connects} AND (NOT (sc)-[:IN_USE_ACTUATOR]->(c)) "

				+"WITH cn, sc, sr, g ORDER BY sr.sum/sr.qty DESC, sr.price "

				+"RETURN cn.device, collect({s:sc.macAddress,g:g.title}) as sens ";

		const cypher_update_actuator = "MATCH (sc:SensorChild {macAddress : {macAddress} }), (c:Category {title: {category} })  "
				+"MERGE (sc)-[:IN_USE_ACTUATOR]->(c) "
				+"RETURN sc ";
						
		db.cypher({
		    query: cypher_con,
		    params: {
	            category: category,
	            connection_device: connection_device,
	            lat: lat,
	            lng: lng,
	            radius: radius											
		    },
		    lean: true
		}, (err, results) =>{
			if (err) 
		    	reject({ status: 500, message: 'Internal Server Error !' });
		    else{
		    	let i, j;

		    	if(results && results.length > 0){

		    		results.forEach(function (obj) {
			             const vet = obj['cons'];
			             vet.forEach(function (cn) {
			             	connects.push(cn.device);
			             });
			             
			        });

			        db.cypher({
					    query: cypher_sens,
					    params: {
				            category: category,
				            connects: connects										
					    },
					    lean: true
					}, (err, results) =>{
						if (err) 
					    	reject({ status: 500, message: 'Internal Server Error !' });
					    else{

					    	results.forEach(function (obj) {
					    		let aux_group = [];
					            const vet = obj['sens'];
					            vet.forEach(function (sen) {
					            	const s = sen['s'];
					            	const g = sen['g'];
					            	if(aux_group[g] === undefined){
					            		aux_group[g] = true;
					            		if(sens.indexOf(s) == -1)
					            			sens.push(s);
					            	}
					            });
					        });

					    	db.cypher({
							    query: cypher,
							    params: {
						            category: category,
						            sens: sens,
						            connects: connects										
							    },
							    lean: true
							}, (err, results) =>{
								if (err) 
							    	reject({ status: 500, message: 'Internal Server Error !' });
							    else{

							    	const connect_position = randomIntFromInterval(0, (results.length-1));

							    	if(results[connect_position] === undefined)
							    		resolve({ status: 201, sensor: null, connect: null });
							    	else{

								    	connect_chosen = results[connect_position]['cn'];
								    	connect_chosen.price = results[connect_position]['cnr'].price;
								    	connect_chosen.rank = parseFloat(results[connect_position]['cnr'].sum)/parseFloat(results[connect_position]['cnr'].qty);
								    	connect_chosen.category = results[connect_position]['g2.title'];

								    	sensors = results[connect_position]['sens'];

								    	const sensor_position = randomIntFromInterval(0, (sensors.length-1));

								    	sensor_chosen = sensors[sensor_position]['s'];
								    	sensor_chosen.price = sensors[sensor_position]['sr'].price;
								    	sensor_chosen.rank = parseFloat(sensors[sensor_position]['sr'].sum)/parseFloat(sensors[sensor_position]['sr'].qty);
								    	sensor_chosen.category = sensors[sensor_position]['g'];
								    	sensor_chosen.macAddress = sensors[sensor_position]['sc'];
								    	sensor_chosen.uuidData = sensors[sensor_position]['r'].uuidData;
								    	sensor_chosen.unit = sensors[sensor_position]['r'].unit;

								    	sensor_chosen.actuator = sensors[sensor_position]['r'].actuator;
								    	sensor_chosen.option_bytes = sensors[sensor_position]['r'].option_bytes;
								    	sensor_chosen.option_description = sensors[sensor_position]['r'].option_description;

								    	if(sensor_chosen.actuator){
									    	db.cypher({
											    query: cypher_update_actuator,
											    params: {
											        macAddress: sensor_chosen.macAddress,
											        category: category
											    },
											    lean: true
											}, (err, results) =>{

												if (err) 
											    	reject({ status: 500, message: 'Internal Server Error !' });
											    else
											    	resolve({ status: 201, sensor: sensor_chosen, connect: connect_chosen });
											});
									    }else
									    	resolve({ status: 201, sensor: sensor_chosen, connect: connect_chosen });
									    }
							    }
							    
							});
					    }
					    
					});

			    
				}else
					resolve({ status: 201, sensor: null, connect: null });
				
		    }
		    
		});

	});

/**
 * @return Returns the services with analytics of the matchmaking algorithm.
 */
exports.getSensorAlgorithmAnalytics = (lat, lng, category, radius, connection_device) => 
	
	new Promise((resolve,reject) => {

		let sensors =[];
		let connects =[];
		let analytcs =[];
		let connect_chosen;
		let sensor_chosen;
		let analytics_chosen;


		const cypher_con = "MATCH (s:Sensor)-[sr:IS_IN]->(g:Group) "
				+ "WITH min(sr.price) as sen_price "

				+ "MATCH (a:Analytics)-[ar:IS_IN]->(g2:Group) "
				+ "WITH min(ar.price) + sen_price as pack_price "

				+ "MATCH (you:Profile) "
				+ "WITH toFloat(you.budget - pack_price) as min_price "

				+ "MATCH (cn:Connection) WHERE cn.signal >= 3 AND cn.batery >= 30 AND (NOT cn.device IN {connection_device}) "
				+ "WITH sin(radians(cn.lat-({lat}))/2)*sin(radians(cn.lat-({lat}))/2) + "
				+ "sin(radians(cn.lng-({lng}))/2)*sin(radians(cn.lng-({lng}))/2)* "
				+ "cos(radians({lat}))*cos(radians(cn.lat)) as d, cn, min_price "

				+ "WITH 6371*2*atan2(sqrt(d), sqrt(1-d)) as da, cn, min_price "
				+ "WHERE da < {radius}  WITH cn, min_price ORDER BY cn.signal DESC, cn.batery DESC "

				+ "MATCH (g:Group)<-[cnr:IS_IN]-(cn)-[:IS_CONNECTED_TO]->(c:Category {title:{category}}) "
				+ "WHERE cnr.price < min_price "

				+ "RETURN g.title, collect(cn.device)[0..1] as cons";

		const cypher_ana = "MATCH (s:Sensor)-[sr:IS_IN]->(g:Group) "
				+ "WITH min(sr.price) as sen_price "

				+ "MATCH (g:Group)<-[cnr:IS_IN]-(cn:Connection) "
				+ "WHERE cn.device IN {connects} "
				+ "WITH min(cnr.price) + sen_price as pack_price "

				+ "MATCH (you:Profile) "
				+ "WITH toFloat(you.budget - pack_price) as min_price "
                                                 
				+ "MATCH (c:Category {title:{category}})<-[:BELONGS_TO]-(a:Analytics)-[ar:IS_IN]->(g2:Group)  "
				+ "WHERE ar.price < min_price AND a.signal >= 3 AND a.batery >= 30 WITH a, min_price, g2 ORDER BY ar.sum/ar.qty DESC  "

				+ "RETURN g2.title, collect(a.device)[0..3] as ans";

		const cypher_sens = "MATCH (g:Group)<-[sr:IS_IN]-(s:Sensor)-[:BELONGS_TO]->(c:Category {title: {category}})  "
				+"MATCH (cn:Connection)-[:IS_NEAR]->(sc:SensorChild)-[:IS_FROM]->(s) "
				+"WHERE cn.device IN {connects} AND (NOT (sc)-[:IN_USE_ACTUATOR]->(c)) "

				+"WITH cn, sc, sr, g ORDER BY sr.sum/sr.qty DESC, sr.price "

				+"RETURN cn.device, collect({s:sc.macAddress,g:g.title}) as sens ";

		const cypher = "MATCH (g:Group)<-[sr:IS_IN]-(s:Sensor)<-[:IS_FROM]-(sc:SensorChild) "
				+"WHERE sc.macAddress IN {sens} "
				+"WITH sr, g, sc, s "
				+"MATCH (cn:Connection)-[cnr:IS_IN]->(g2:Group) "
				+"MATCH (c1:Category {title: {category}})<-[aar:BELONGS_TO]-(a:Analytics)-[ar:IS_IN]->(g3:Group), (you:Profile), (s)-[r:BELONGS_TO]->(c:Category {title: {category}}) "
				+"WHERE cn.device IN {connects} AND a.device IN {anacs} AND (cn)-[:IS_NEAR]->(sc) AND ((sr.price + cnr.price + ar.price) <= you.budget) "
                    
                +"WITH cn, cnr, s, sr, a, ar, g, g2, g3, sc, r, aar ORDER BY sr.sum/sr.qty DESC, sr.price, ar.sum/ar.qty DESC, ar.price "                    
				+"RETURN cn, cnr, g2.title, collect({a: a, ar: ar, g3:g3.title, s: s, sr: sr, g:g.title,r:r,sc:sc.macAddress, aar: aar}) as res ORDER BY cnr.sum/cnr.qty DESC, cnr.price, cn.signal DESC, cn.batery DESC ";

		db.cypher({
		    query: cypher_con,
		    params: {
	            category: category,
	            connection_device: connection_device,
	            lat: lat,
	            lng: lng,
	            radius: radius											
		    },
		    lean: true
		}, (err, results) =>{
			
			if (err) 
		    	reject({ status: 500, message: 'Internal Server Error !' });
		    else{
		    	let i;

		    	if(results && results.length > 0){

		    		results.forEach(function (obj) {
			             const vet = obj['cons'];
			             vet.forEach(function (cn) {
			             	connects.push(cn);
			             });
			             
			        });

			        db.cypher({
					    query: cypher_ana,
					    params: {
				            category: category,
				            connects: connects										
					    },
					    lean: true
					}, (err, results) =>{

						if (err) 
					    	reject({ status: 500, message: 'Internal Server Error !' });
					    else{

					    	results.forEach(function (obj) {
					             const vet = obj['ans'];
					             const analytic_position = randomIntFromInterval(0, (vet.length-1));
					             analytcs.push(vet[analytic_position]);
					        });

					        db.cypher({
							    query: cypher_sens,
							    params: {
						            category: category,
						            connects: connects								
							    },
							    lean: true
							}, (err, results) =>{
								if (err) 
							    	reject({ status: 500, message: 'Internal Server Error !' });
							    else{

							    	results.forEach(function (obj) {
							    		let aux_group = [];
							            const vet = obj['sens'];
							            vet.forEach(function (sen) {
							            	const s = sen['s'];
							            	const g = sen['g'];
							            	if(aux_group[g] === undefined){
							            		aux_group[g] = true;
							            		if(sensors.indexOf(s) == -1)
							            			sensors.push(s);
							            	}
							            });
							        });

							        db.cypher({
									    query: cypher,
									    params: {
									    	category: category,
								            anacs: analytcs,
								            sens: sensors,
								            connects: connects								
									    },
									    lean: true
									}, (err, results) =>{
										if (err) 
									    	reject({ status: 500, message: 'Internal Server Error !' });
									    else{

									    	let result = [];
									    	let cns = [];
									    	let ans_obj = [];

									    	results.forEach(function (obj) {
									    		let cn = obj['cn'];
									    		cn.price = obj['cnr'].price;
									    		cn.rank = parseFloat(obj['cnr'].sum)/parseFloat(obj['cnr'].qty);
									    		cn.category = obj['g2.title'];
									    		result[cn.device] = [];

									            const vet = obj['res'];
									            if(vet.length > 0)
									            	cns.push(cn);

									            vet.forEach(function (sen) {
									            	let s = sen['s'];
									            	s.price = sen['sr'].price;
									            	s.rank = parseFloat(sen['sr'].sum)/parseFloat(sen['sr'].qty);
									            	s.category = sen['g'];
									            	s.macAddress = sen['sc'];
							    					s.uuidData = sen['r'].uuidData;
							    					s.unit = sen['r'].unit;

							    					s.actuator = sen['r'].actuator;
											    	s.option_bytes = sen['r'].option_bytes;
											    	s.option_description = sen['r'].option_description;

									            	let a = sen['a'];
									            	a.price = sen['ar'].price;
									            	a.rank = parseFloat(sen['ar'].sum)/parseFloat(sen['ar'].qty);
									            	a.category = sen['g3'];
									            	a.services_description = sen['aar'].services_description;
							    					a.services_prices = sen['aar'].services_prices;

									            	if(result[cn.device][a.device] === undefined)
									            		result[cn.device][a.device] = [];

									            	if(result[cn.device][a.device].indexOf(s) == -1)
								            			result[cn.device][a.device].push(s);  

								            		ans_obj[a.device] = a;	
									            });
									        });
									        
									        const connect_position = randomIntFromInterval(0, (cns.length-1));
									        connect_chosen = cns[connect_position];


									        if(connect_chosen === undefined){
									        	resolve({ status: 201, sensor: null, connect: null, analytics : null });
									        }else{
									        
										        let an_s_combination = result[connect_chosen.device];

										        let strName, strValue, ans = [];
												for(strName in an_s_combination)
												   ans.push(strName);

												const analytics_position = randomIntFromInterval(0, (ans.length-1));
												let sensor_vet = an_s_combination[ans[analytics_position]];
												analytics_chosen = ans_obj[ans[analytics_position]];

												const sensor_position = randomIntFromInterval(0, (sensor_vet.length-1));
												sensor_chosen = sensor_vet[sensor_position];

												//console.log(analytics_chosen.device)

												resolve({ status: 201, sensor: sensor_chosen, connect: connect_chosen, analytics : analytics_chosen });
											}
											
									    }
									    
									});
							    }
							    
							});
					    }
					    
					});
				}else
					resolve({ status: 201, sensor: null, connect: null, analytics : null });
				
		    }
		    
		});

	});

/**
 * @return Returns a new analytics provider after disconnection of the old one.
 */
exports.getNewAnalytics = (category, analytics_device, connection_device, macAddress) => 
	
	new Promise((resolve,reject) => {

		let analytics_chosen;
		let analytcs = [];

		const cypher_ana = "MATCH (sc:SensorChild {macAddress: {macAddress}})-[:IS_FROM]->(s:Sensor)-[sr:IS_IN]->(g:Group) "
				+ "WITH sr.price as sen_price "

				+ "MATCH (g:Group)<-[cnr:IS_IN]-(cn:Connection {device: {device}}) "
				+ "WITH cnr.price + sen_price as pack_price "

				+ "MATCH (you:Profile) "
				+ "WITH toFloat(you.budget - pack_price) as min_price "
                                                 
				+ "MATCH (c:Category {title:{category}})<-[:BELONGS_TO]-(a:Analytics)-[ar:IS_IN]->(g2:Group)  "
				+ "WHERE ar.price < min_price AND a.signal >= 3 AND a.batery >= 30 AND (NOT a.device  IN {analytics_device}) "
				+ "WITH a, min_price, g2, ar ORDER BY ar.sum/ar.qty DESC "

				+ "RETURN g2.title, collect({a: a, ar: ar})[0..3] as ans";

		db.cypher({
		    query: cypher_ana,
		    params: {
	            category: category,
	            analytics_device: analytics_device,
	            macAddress: macAddress,
	            device: connection_device,									
		    },
		    lean: true
		}, (err, results) =>{
			if (err) 
		    	reject({ status: 500, message: 'Internal Server Error !' });
		    else{

		    	if(results && results.length > 0){

			    	results.forEach(function (obj) {
						const vet = obj['ans'];
						const analytic_position = randomIntFromInterval(0, (vet.length-1));

						let a = vet[analytic_position]['a'];
						let ar = vet[analytic_position]['ar'];
						a.price = ar.price;
						a.rank = parseFloat(ar.sum)/parseFloat(ar.qty);
						a.category = obj['g2.title'];

						analytcs.push(a);
			        });

			    	if(analytcs.length > 0){
				        const analytic_position = randomIntFromInterval(0, (analytcs.length-1));
				        analytics_chosen = analytcs[analytic_position];

				    	resolve({ status: 201, analytics : analytics_chosen });
			    	}
			        else
			        	resolve({ status: 201, analytics : null });
		    	}else
		    		resolve({ status: 201, analytics : null });
		    }
		    
		});

	});


/**
 * @return Returns if the sensor is registered in the database
 */
exports.getSensorRegistered = (macAddress) => 
	
	new Promise((resolve,reject) => {

		let services = [];

		const cypher = "MATCH (sc:SensorChild {macAddress:{macAddress}})-[:IS_FROM]->(s:Sensor)-[r:BELONGS_TO]->(c:Category) "
					+"RETURN c.title, r ";

		db.cypher({
		    query: cypher,
		    params: {
	            macAddress: macAddress										
		    },
		    lean: true
		}, (err, results) =>{

			if (err) 
		    	reject({ status: 500, message: 'Internal Server Error !' });
		    else{
		    	if(results.length > 0){
		    		results.forEach(function (obj) {
			            let sensor = obj['r'];
			            sensor.name = obj['c.title']
			            services.push(sensor);
			        });
		    		resolve({ status: 201, message: 'YES', services: services });
		    	}
		    	else
		    		resolve({ status: 203, message: 'NO' });
		    }
		    
		});

	});


/**
 * @return Updates sensor parameters
 */
exports.setSensorParameters = (macAddress, device, rssi) => 
	
	new Promise((resolve,reject) => {

		const cypher_connected = "MATCH (cn:Connection {device:{device}}), (c:Category)<-[:BELONGS_TO]-(s:Sensor)<-[:IS_FROM]-(sc:SensorChild {macAddress:{macAddress}}) "
					+"WHERE sc.inUse = false "
					+"OPTIONAL MATCH (cn)-[r:IS_CONNECTED_TO]->(c)<-[:BELONGS_TO]-(s) "
					+"WITH count(r) as connected, cn, c, sc "
					+"FOREACH (ignoreMe in CASE "
						+"  WHEN connected = 0  THEN [1] "
						+"  ELSE [] END | MERGE (cn)-[r:IS_CONNECTED_TO {num_sensors: 0}]->(c) ) "
					+"WITH connected, sc "
					+"SET sc.inUse = true "
					+"RETURN connected ";



		const cypher = "MATCH (cn:Connection {device:{device}})-[r:IS_CONNECTED_TO]->(c:Category)<-[:BELONGS_TO]-(s:Sensor)<-[:IS_FROM]-(sc:SensorChild {macAddress:{macAddress}}) "
					+"WHERE sc.inUse = true "
					+"OPTIONAL MATCH (cn)-[sr:IS_NEAR]->(sc) "
					+"SET sc.rssi = {rssi} "
					+"WITH count(sr) as near, r, cn, sc "
					+"FOREACH (ignoreMe in CASE "
						+"  WHEN near = 0  THEN [1] "
						+"  ELSE [] END | SET r.num_sensors = r.num_sensors + 1) "
					+"WITH cn, sc "
					+"MERGE (cn)-[:IS_NEAR]->(sc) "
					+"RETURN cn ";

		db.cypher({
		    query: cypher_connected,
		    params: {
	            device: device,
	            macAddress: macAddress									
		    },
		    lean: true
		}, (err, results) =>{
			if (err) 
		    	reject({ status: 500, message: 'Internal Server Error !' });
		    else{
		    	db.cypher({
				    query: cypher,
				    params: {
			            device: device,
			            macAddress: macAddress,
			            rssi: rssi										
				    },
				    lean: true
				}, (err, results) =>{
					if (err) 
				    	reject({ status: 500, message: 'Internal Server Error !' });
				    else
				    	resolve({ status: 201, message: 'YES' });
				});
		    }
		});

	});


/**
 * @return Removes the relation between a sensor and a connection provider
 */
exports.removeSensorMobileHub = (macAddress, device) => 
	
	new Promise((resolve,reject) => {

		const cypher = "MATCH (cn:Connection {device:{device}})-[r:IS_NEAR]->(sc:SensorChild {macAddress:{macAddress}})-[:IS_FROM]->(s:Sensor)-[:BELONGS_TO]->(c:Category) "
					+"MATCH (cn)-[sr:IS_CONNECTED_TO]->(c) "
					+"OPTIONAL MATCH (sc)-[use:IN_USE_ACTUATOR]->(c) "
					+"SET sr.num_sensors = sr.num_sensors - 1, sc.inUse = false "
					+"DELETE r, use ";

		db.cypher({
		    query: cypher,
		    params: {
	            device: device,
	            macAddress: macAddress									
		    },
		    lean: true
		}, (err, results) =>{
			if (err) 
		    	reject({ status: 500, message: 'Internal Server Error !' });
		    else
		    	resolve({ status: 201, message: 'YES' });
		});

	});


/**
 * @return Updates the actuator state
 */
exports.setActuatorState = (macAddress, category) => 
	
	new Promise((resolve,reject) => {

		const cypher = "MATCH (sc:SensorChild {macAddress:{macAddress}})-[use:IN_USE_ACTUATOR]->(c:Category {title:{category}}) "
					+"DELETE use ";

		db.cypher({
		    query: cypher,
		    params: {
	            category: category,
	            macAddress: macAddress									
		    },
		    lean: true
		}, (err, results) =>{
			if (err) 
		    	reject({ status: 500, message: 'Internal Server Error !' });
		    else
		    	resolve({ status: 201, message: 'OK' });
		});

	});