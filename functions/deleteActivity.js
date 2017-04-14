'use strict';

const db = require('../models/Connection');
const firebase = require('../models/Firebase');

exports.deleteActivity = (id_raw, delete_commitment_repeat, type_raw) => 
	
	new Promise((resolve,reject) => {

		const id = parseInt(id_raw);
		const type = parseInt(type_raw);

		let guests = [];

		let cypher_title_creator = "MATCH (p) WHERE id(p)= {id} ";

		if(type == 1)
			cypher_title_creator = cypher_title_creator + "MATCH (guest:Profile)-[r:SIGNALIZED_TO {created : true}]-> (p) ";
		else if(type == 0)
			cypher_title_creator = cypher_title_creator + "MATCH (guest:Profile)-[r:INVITED_TO {created : true}]-> (p) ";

		cypher_title_creator = cypher_title_creator + "RETURN guest.name, p.title";

		if(delete_commitment_repeat > 0){

			let cypher_participants = "MATCH (p) WHERE id(p)= {id} "
				+"MATCH (n) WHERE n.repeat_id_original = p.repeat_id_original AND NOT n.repeat_id_original = -1 ";

				if(type == 1)
					cypher_participants = cypher_participants + "MATCH (guest:Profile)-[r:SIGNALIZED_TO {created : false}]-> (n) ";
				else if(type == 0)
					cypher_participants = cypher_participants + "MATCH (guest:Profile)-[r:INVITED_TO {created : false}]-> (n) ";

				cypher_participants = cypher_participants + "RETURN distinct guest";

			const cypher_repeat = "MATCH (p) WHERE id(p)= {id} "
				+"MATCH (n) WHERE n.repeat_id_original = p.repeat_id_original AND NOT n.repeat_id_original = -1 "
				+"DETACH DELETE n";

				if(type == 2){
					db.cypher({
				    	query: cypher_repeat,
						    params: {
						        id: id
						    },
					    lean: true
					}, (err, results) =>{
						if (err) 
					    	reject({ status: 500, message: 'Internal Server Error !' });
					    else
							resolve({ status: 200, message: 'Atividades deletadas corretamente' }); 
					});
				}else{
					db.cypher({
				    	query: cypher_participants,
						    params: {
						        id: id
						    },
					    lean: true
					}, (err, results) =>{
						if (err) 
					    	reject({ status: 500, message: 'Internal Server Error !' });
					    else{

					    	results.forEach(function (obj) {
					            const guest = obj['guest'];
					            guests.push(guest);
					        });

							db.cypher({
						    	query: cypher_title_creator,
								    params: {
								        id: id
								    },
							    lean: true
							}, (err, results) =>{
								if (err) 
							    	reject({ status: 500, message: 'Internal Server Error !' });
							    else{

							    	let title, creator;

							    	results.forEach(function (obj) {
							            creator = obj['guest.name'];
							            title = obj['p.title'];
							        });

							        let registrationTokens = [];

									const cypher_device = "MATCH (p:Profile {email:{email}})-[:LOGGED_DEVICE]->(d:Device) "
													+ "RETURN d ";


									guests.forEach(function (guest) {
										registrationTokens.length = 0;

							            db.cypher({
										    query: cypher_device,
										    params: {
											    email: guest.email
											},
										    lean: true
										}, (err, results) =>{
											if (err) 
										    	reject({ status: 500, message: 'Internal Server Error !' });
										    else if(results.length > 0){
										    	results.forEach( (obj) => {
											    	const device = obj['d'];
										            registrationTokens.push(device.token);
										        });

										        let notification = {
												  data: {
												  	type: "cancel",
												    name: creator,
												    photo: "",
												    title: title,
												    n_solicitation: type.toString()
												  }
												};

												firebase.messaging().sendToDevice(registrationTokens, notification)
												  .then(function(response) {
												  })
												  .catch(function(error) {
												  });
										    }
										});
							        });


									db.cypher({
								    	query: cypher_repeat,
										    params: {
										        id: id
										    },
									    lean: true
									}, (err, results) =>{
										if (err) 
									    	reject({ status: 500, message: 'Internal Server Error !' });
									    else{
											resolve({ status: 200, message: 'Atividades deletadas corretamente' }); 
									    }
									});
							    }
							});
					    }
					});
				}
		}else{

			const cypher = "MATCH (p) WHERE id(p)= {id} "
					+ "MATCH (n) WHERE n.repeat_id_original = p.repeat_id_original AND NOT n.repeat_id_original = -1 "
					+ "SET n.repeat_qty = (n.repeat_qty - 1) "
					+ "RETURN n";

			const cypher_delete = "MATCH (f) WHERE id(f)= {id} "
				+"DETACH DELETE f";

			let cypher_participants = "MATCH (p) WHERE id(p)= {id} ";

			if(type == 1)
				cypher_participants = cypher_participants + "MATCH (guest:Profile)-[r:SIGNALIZED_TO {created : false}]-> (p) ";
			else if(type == 0)
				cypher_participants = cypher_participants + "MATCH (guest:Profile)-[r:INVITED_TO {created : false}]-> (p) ";

			cypher_participants = cypher_participants + "RETURN distinct guest";

			db.cypher({
			    query: cypher,
			    params: {
			        id: id
			    },
			    lean: true
			}, (err, results) =>{
				if (err) 
			    	reject({ status: 500, message: 'Internal Server Error !' });
			    else{
			    	db.cypher({
				    	query: cypher_participants,
						    params: {
						        id: id
						    },
					    lean: true
					}, (err, results) =>{
						if (err) 
					    	reject({ status: 500, message: 'Internal Server Error !' });
					    else{

					    	results.forEach(function (obj) {
					            const guest = obj['guest'];
					            guests.push(guest);
					        });

							db.cypher({
						    	query: cypher_title_creator,
								    params: {
								        id: id
								    },
							    lean: true
							}, (err, results) =>{
								if (err) 
							    	reject({ status: 500, message: 'Internal Server Error !' });
							    else{

							    	let title, creator;

							    	results.forEach(function (obj) {
							            creator = obj['guest.name'];
							            title = obj['p.title'];
							        });

							        let registrationTokens = [];

									const cypher_device = "MATCH (p:Profile {email:{email}})-[:LOGGED_DEVICE]->(d:Device) "
													+ "RETURN d ";


									guests.forEach(function (guest) {
										registrationTokens.length = 0;

							            db.cypher({
										    query: cypher_device,
										    params: {
											    email: guest.email
											},
										    lean: true
										}, (err, results) =>{
											if (err) 
										    	reject({ status: 500, message: 'Internal Server Error !' });
										    else if(results.length > 0){
										    	results.forEach( (obj) => {
											    	const device = obj['d'];
										            registrationTokens.push(device.token);
										        });

										        let notification = {
												  data: {
												  	type: "cancel",
												    name: creator,
												    photo: "",
												    title: title,
												    n_solicitation: type.toString()
												  }
												};

												firebase.messaging().sendToDevice(registrationTokens, notification)
												  .then(function(response) {
												  })
												  .catch(function(error) {
												  });
										    }
										});
							        });


									db.cypher({
								    	query: cypher_delete,
										    params: {
										        id: id
										    },
									    lean: true
									}, (err, results) =>{
										if (err) 
									    	reject({ status: 500, message: 'Internal Server Error !' });
									    else{
											resolve({ status: 200, message: 'Atividades deletadas corretamente' }); 
									    }
									});
							    }
							});
					    }
					});
			    }
			});
		}


		

	});