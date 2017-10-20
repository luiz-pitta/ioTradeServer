'use strict';

/**
 * Module that returns user information to IoTrade
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
function getCurrentGroup(battery, signal)
{
	let factor = 0;
	let category = 0;
    if(battery < 80 && battery >= 60)
    	factor = 1;
    else if(battery < 60 && battery >= 30)
    	factor = 2;
    else if(battery < 30)
    	factor = 3;

    switch(signal) {
		case 2:
		    category = 0;
		    break;
		case 3:
			category = 1;
		    break;
		case 4:
			category = 2;
		    break;
		case 5:
			category = 3 - factor;
		    break;
		case 6:
			category = 4 - factor;
		    break;
		case 7:
			category = 5 - factor;
		    break;
		case 8:
			category = 6 - factor;
		    break;
		case 9:
			category = 7 - factor;
		    break;
		case 10:
			category = 8 - factor;
		    break;
		default:
		    break;
	}

	return category;
}

/**
 * @return Returns the user of the server.
 */
exports.getProfile = () => 
	
	new Promise((resolve,reject) => {

		let user;

		const cypher = "MATCH (p:Profile) "
					+"RETURN p ";

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
		            let p = obj['p'];
		            user = p;
		        });

		        try{
					assert.exists(user, 'Usuário Existe!');
				}catch(err){
					console.log(err.message);
				}

				resolve({ status: 201, user: user });
		    }
		    
		});

	});

/**
 * @return Creates the connection user in the database.
 */
exports.setLocationMobileHub = (name, uuid, battery, signal, lat, lng, accuracy, active, device) => 
	
	new Promise((resolve,reject) => {

		let user, group;

		let price = [0.20,0.25,0.30,0.35,0.40,0.50,0.60,0.75,0.90,1.20];

		const cypher = "MATCH (c:Connection {device:{device}}) "
					+"SET c.batery = {battery}, c.signal = {signal}, c.lat = {lat}, c.lng = {lng}, "
					+"c.accuracy = {accuracy}, c.active = {active}, c.device = {device}, c.uuid = {uuid} "
					+"RETURN c ";

		const cypher_new = "MATCH (o:Owner {name:{name}}) "
					+"MATCH (g:Group {title:{title}})  "
					+"MERGE (o)-[:OWNS]->(c:Connection {device:{device}}) "
					+"MERGE (c)-[:IS_IN {price:{price},sum:5,qty:1}]->(g) " 
					+"SET c.batery = {battery}, c.signal = {signal}, c.lat = {lat}, c.lng = {lng}, "
					+"c.accuracy = {accuracy}, c.active = {active}, c.device = {device}, c.uuid = {uuid} "
					+"RETURN c ";

		const cypher_group = "MATCH (c:Connection {device:{device}})-[r:IS_IN]->(g:Group) MATCH (g2:Group {title: {title_new}}) "
					+"WITH  r.qty as qty, r.sum as sum, c, g2, r " 
					+"CREATE (c)-[:IS_IN {price: {price}, qty:qty, sum:sum}]->(g2) DELETE r ";			

		if(active)
			group = getCurrentGroup(battery, signal);
		else
			group = 0;

		db.cypher({
		    query: cypher,
		    params: {
				uuid: uuid,
				battery: battery,
				signal: signal,
				lat: lat,
				lng: lng,
				accuracy: accuracy,
				device: device,
				active: active

		    },
		    lean: true
		}, (err, results) =>{
			if (err) 
		    	reject({ status: 500, message: 'Internal Server Error !' });
		    else{

		    	if(results.length == 0){
		    	
		    		db.cypher({
					    query: cypher_new,
					    params: {
				            name: name,
							uuid: uuid,
							battery: battery,
							signal: signal,
							lat: lat,
							lng: lng,
							accuracy: accuracy,
							device: device,
							active: active,
							title: 'C' + group,
							price: price[group]												
					    },
					    lean: true
					}, (err, results) =>{
						if (err) 
					    	reject({ status: 500, message: 'Internal Server Error !' });
					    else
					    	resolve({ status: 201, message: 'CON' });
					});
		    	}else if(!active){
		    			const cypher_remove = "MATCH (cn:Connection {device:{device}})-[r:IS_NEAR]->(sc:SensorChild) "
		    								+"OPTIONAL MATCH (sc)-[use:IN_USE_ACTUATOR]->(c:Category) "
		    								+"SET sc.inUse = false "
											+"DELETE r, use ";

						const cypher_remove_update = "MATCH (cn:Connection {device:{device}})-[r:IS_CONNECTED_TO]->(c:Category) "
										+"SET r.num_sensors = 0 ";

						db.cypher({
						    query: cypher_remove,
						    params: {
					            device: device								
						    },
						    lean: true
						}, (err, results) =>{
							if (err) 
						    	reject({ status: 500, message: 'Internal Server Error !' });
						    else{
						    	db.cypher({
								    query: cypher_remove_update,
								    params: {
							            device: device									
								    },
								    lean: true
								}, (err, results) =>{
									if (err) 
								    	reject({ status: 500, message: 'Internal Server Error !' });
								    else{
								    	db.cypher({
										    query: cypher_group,
										    params: {
										        device: device,
										        price: price,
										        title_new: 'C' + group,
										        price: price[group]	
										    },
										    lean: true
										}, (err, results) =>{

											if (err) 
										    	reject({ status: 500, message: 'Internal Server Error !' });
										    else
										    	resolve({ status: 201, message: 'CON' });
										});
								    }
								    
								});
						    }
						});
				}else{
					db.cypher({
					    query: cypher_group,
					    params: {
					        device: device,
					        price: price,
					        title_new: 'C' + group,
					        price: price[group]	
					    },
					    lean: true
					}, (err, results) =>{

						if (err) 
					    	reject({ status: 500, message: 'Internal Server Error !' });
					    else
					    	resolve({ status: 201, message: 'CON' });
					});
	    			
				}
		    }
		    
		});

	});


/**
 * @return Creates the analytics user in the database.
 */
exports.setAnalyticsMobileHub = (name, uuid, battery, signal, active, device) => 
	
	new Promise((resolve,reject) => {

		let user, group;

		let price = [0.25,0.30,0.35,0.40,0.45,0.60,0.70,0.85,1.00,1.30];

		const cypher = "MATCH (a:Analytics {device:{device}}) "
					+"SET a.batery = {battery}, a.signal = {signal}, a.active = {active}, "
					+"a.device = {device}, a.uuid = {uuid} "
					+"RETURN a ";

		const cypher_new = "MATCH (o:Owner {name:{name}}) "
					+"MATCH (g:Group {title:{title}})  "
					+"MERGE (o)-[:OWNS]->(a:Analytics {device:{device}}) "
					+"MERGE (a)-[:IS_IN {price:{price},sum:5,qty:1}]->(g) " 
					+"SET a.batery = {battery}, a.signal = {signal}, a.active = {active},  "
					+"a.device = {device},  a.uuid = {uuid} "
					+"RETURN a ";

		const cypher_group = "MATCH (a:Analytics {device:{device}})-[r:IS_IN]->(g:Group) MATCH (g2:Group {title: {title_new}}) "
					+"WITH  r.qty as qty, r.sum as sum, a, g2, r " 
					+"CREATE (a)-[:IS_IN {price: {price}, qty:qty, sum:sum}]->(g2) DELETE r ";			

		if(active)
			group = getCurrentGroup(battery, signal);
		else
			group = 0;

		db.cypher({
		    query: cypher,
		    params: {
				uuid: uuid,
				battery: battery,
				signal: signal,
				device: device,
				active: active

		    },
		    lean: true
		}, (err, results) =>{
			if (err) 
		    	reject({ status: 500, message: 'Internal Server Error !' });
		    else{

		    	if(results.length == 0){
		    	
		    		db.cypher({
					    query: cypher_new,
					    params: {
				            name: name,
							uuid: uuid,
							battery: battery,
							signal: signal,
							device: device,
							active: active,
							title: 'C' + group,
							price: price[group]												
					    },
					    lean: true
					}, (err, results) =>{
						if (err) 
					    	reject({ status: 500, message: 'Internal Server Error !' });
					    else
					    	resolve({ status: 201, message: 'ANA' });
					});
		    	}else{
					db.cypher({
					    query: cypher_group,
					    params: {
					        device: device,
					        price: price,
					        title_new: 'C' + group,
					        price: price[group]	
					    },
					    lean: true
					}, (err, results) =>{
						if (err) 
					    	reject({ status: 500, message: 'Internal Server Error !' });
					    else
					    	resolve({ status: 201, message: 'ANA' });
					});
	    			
				}
		    }
		    
		});

	});