'use strict';

const db = require('../models/Connection');
const firebase = require('../models/Firebase');

exports.registerFlag = (creator, v_guest, type,title,day_start,month_start,year_start,day_end,
				month_end,year_end,minute_start,hour_start,minute_end,hour_end,repeat_type,repeat_qty, toAll,
				day_list_start,month_list_start,year_list_start,day_list_end,month_list_end,year_list_end) => 

	new Promise((resolve,reject) => {

		const dt = new Date();
		const dt_mili = dt.getTime();

 		const cypher = "MATCH (you:Profile {email:{creator}}) MERGE (flag:Flag { "
		           + "title:{title}, "
		           + "date_time_creation:{date_time_creation}, "
		           + "type:{type}, "

		           + "day_start:{day_start}, "
		           + "month_start:{month_start}, "
		           + "year_start:{year_start}, "
		           + "day_end:{day_end}, "
		           + "month_end:{month_end}, "
		           + "year_end:{year_end},"

		           + "minute_start:{minute_start}, "
		           + "hour_start:{hour_start}, "
		           + "minute_end:{minute_end}, "
		           + "hour_end:{hour_end}, "

		           + "repeat_type:{repeat_type}, "
		           + "repeat_qty:{repeat_qty}, "
		           + "repeat_id_original:{repeat_id_original} }) "
		           + "MERGE (you) -[:SIGNALIZED_TO { created : {created},  visualization_invitation_accepted : {visualization_invitation_accepted}, "
				   + "id_inviter : {id_inviter}, invitation : {invitation}, invite_date : {invite_date} "
				   + " }]-> (flag) RETURN flag";

        const cypher_all_friends = "MATCH (you:Profile {email:{creator}})-[:KNOWS]-(n:Profile) "
					+"MATCH (f) WHERE id(f)= {id} "
					+ "MERGE (n) -[:SIGNALIZED_TO { created : {created},  visualization_invitation_accepted : {visualization_invitation_accepted}, "
				    + "id_inviter : {id_inviter}, invitation : {invitation}, invite_date : {invite_date} }]-> (f) "
					+"RETURN n.email";

		const cypher_guest = "MATCH (guest_act:Profile {email:{guest}}) "
					+"MATCH (f) WHERE id(f)= {id} "
					+ "MERGE (guest_act) -[:SIGNALIZED_TO { created : {created},  visualization_invitation_accepted : {visualization_invitation_accepted}, "
				    + "id_inviter : {id_inviter}, invitation : {invitation}, invite_date : {invite_date} }]-> (f) "
					+"RETURN guest_act";

		if(repeat_type == 0){
			db.cypher({
			    query: cypher,
			    params: {
			        title: title,
		            date_time_creation: dt_mili,
		            type: type,
					day_start: day_start,
					month_start: month_start,
					year_start: year_start,
					day_end: day_end,
					month_end: month_end,
					year_end: year_end,
					minute_start: minute_start,
					hour_start: hour_start,
					minute_end: minute_end,
					hour_end: hour_end,
					repeat_type: repeat_type,
					repeat_qty: repeat_qty,
					repeat_id_original: -1,

					creator: creator,
					id_inviter: creator,
					created: true,
					visualization_invitation_accepted: true,
					invitation: 1,
					invite_date: dt_mili


			    },
			}, (err, results) =>{
				if(err)
					reject({ status: 500, message: 'Internal Server Error !' });
				else if (results){

					const result = results[0];
					const flag = result['flag'];
					let flagServer = flag['properties'];
					flagServer.id = flag._id;


					if(toAll && type){
						db.cypher({
							    query: cypher_all_friends,
							    params: {
							        id: flag._id,
							        creator: creator,
									id_inviter: creator,
									created: false,
									visualization_invitation_accepted: false,
									invitation: 0,
									invite_date: dt_mili
							    },
							    lean: true
								}, (err, results) =>{
									if(err)
										reject({ status: 500, message: 'Internal Server Error !' });

									let usrs = [];

									results.forEach( (obj) => {
								    	const user = obj['n.email'];
							            usrs.push(user);
							        });

							        let n_solicitation;

									const cypher_device = "MATCH (p:Profile {email:{email}})-[:LOGGED_DEVICE]->(d:Device) "
													+ "OPTIONAL MATCH (p)-[r:SIGNALIZED_TO {visualization_invitation_accepted : {visualization_invitation_accepted}, invitation: {invitation}}]->(f:Flag) "
													+ "OPTIONAL MATCH (p)-[s:INVITED_TO {invitation_accepted_visualized : {invitation_accepted_visualized}, invitation: {invitation}}]->(a:Activity) "
													+ "RETURN d, size(collect(distinct r)), size(collect(distinct s)) ";


							        usrs.forEach(function (guest) {

							            db.cypher({
										    query: cypher_device,
										    params: {
											    email: guest,
											    visualization_invitation_accepted: false,
											    invitation_accepted_visualized: false,
										    	invitation: 0
											},
										    lean: true
										}, (err, results) =>{
											if (err) 
										    	reject({ status: 500, message: 'Internal Server Error !' });
										    else if(results.length > 0){
										    	let registrationTokens = [];

										    	results.forEach( (obj) => {
											    	const device = obj['d'];
											    	n_solicitation = obj['size(collect(distinct r))'] + obj['size(collect(distinct s))'];
										            registrationTokens.push(device.token);
										        });

										        let notification = {
												  data: {
												  	type: "invite",
												    name: "",
												    photo: "",
												    title: "",
												    n_solicitation: n_solicitation.toString()
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
								});
					}
					else{
						v_guest.forEach( (guest) => {
				            db.cypher({
							    query: cypher_guest,
							    params: {
							        id: flag._id,
							        guest: guest,
							        id_inviter: creator,
									created: false,
									visualization_invitation_accepted: false,
									invitation: 0,
									invite_date: dt_mili
							    },
								}, (err, results) =>{
									if(err)
										reject({ status: 500, message: 'Internal Server Error !' });
								});
				        });

				        let n_solicitation;

						const cypher_device = "MATCH (p:Profile {email:{email}})-[:LOGGED_DEVICE]->(d:Device) "
												+ "OPTIONAL MATCH (p)-[r:SIGNALIZED_TO {visualization_invitation_accepted : {visualization_invitation_accepted}, invitation: {invitation}}]->(f:Flag) "
												+ "OPTIONAL MATCH (p)-[s:INVITED_TO {invitation_accepted_visualized : {invitation_accepted_visualized}, invitation: {invitation}}]->(a:Activity) "
												+ "RETURN d, size(collect(distinct r)), size(collect(distinct s)) ";


				        v_guest.forEach(function (guest) {

				            db.cypher({
							    query: cypher_device,
							    params: {
								    email: guest,
								    invitation_accepted_visualized: false,
									visualization_invitation_accepted: false,
							    	invitation: 0
								},
							    lean: true
							}, (err, results) =>{
								if (err) 
							    	reject({ status: 500, message: 'Internal Server Error !' });
							    else if(results.length > 0){
							    	let registrationTokens = [];

							    	results.forEach( (obj) => {
								    	const device = obj['d'];
								    	n_solicitation = obj['size(collect(distinct r))'] + obj['size(collect(distinct s))'] + 1;
							            registrationTokens.push(device.token);
							        });

							        let notification = {
									  data: {
									  	type: "invite",
									    name: "",
									    photo: "",
									    title: "",
									    n_solicitation: n_solicitation.toString()
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
					}
					
					resolve({ status: 201, message: 'Flag Resgistrado com sucesso!', flag: flagServer });
			        
				}

			});
		}else{

			const id_original = new Date() + title + type + day_start + month_start + year_start + creator;
			const repeat_qty2 = parseInt(repeat_qty);

			const cypher_repeat = "MATCH (you:Profile {email:{creator}}) "
					+ "FOREACH (r IN range(1,{repeat_qty}) | MERGE (flag:Flag { "
					+ "title:{title},"
					+ "type:{type}, "
					+ "date_time_creation:{date_time_creation},"
					
					+ "day_start:{day_start},"
					+ "month_start:{month_start},"
					+ "year_start:{year_start},"
					+ "day_end:{day_end},"
					+ "month_end:{month_end},"
					+ "year_end:{year_end},"

					+ "minute_start:{minute_start},"
					+ "hour_start:{hour_start},"
					+ "minute_end:{minute_end},"
					+ "hour_end:{hour_end},"

					+ "repeat_type:{repeat_type},"
					+ "repeat_qty:{repeat_qty},"
					+ "repeat_id_original:{repeat_id_original} + r "

					+ "}) "
					+ "MERGE (you) -[:SIGNALIZED_TO { created : {created},  visualization_invitation_accepted : {visualization_invitation_accepted}, "
				    + "id_inviter : {id_inviter}, invitation : {invitation}, invite_date : {invite_date} }]-> (flag) ) "
					+ "WITH you "
					+ "MATCH (f:Flag {repeat_id_original: {complement}}) "
					+ "RETURN f";

			db.cypher({
			    query: cypher_repeat,
			    params: {
			        title: title,
			        type: type,
		            date_time_creation: dt_mili,

					day_start: 1,
					month_start: 1,
					year_start: 1,
					day_end: 1,
					month_end: 1,
					year_end: 1,

					minute_start: minute_start,
					hour_start: hour_start,
					minute_end: minute_end,
					hour_end: hour_end,

					repeat_type: repeat_type,
					repeat_qty: repeat_qty2,
					repeat_id_original: id_original,

					creator: creator,
					id_inviter: creator,
					created: true,
					visualization_invitation_accepted: true,
					invitation: 1,
					invite_date: dt_mili,
			        complement: id_original + 1	

			    },
			}, (err, results) =>{
				if(err)
					reject({ status: 500, message: 'Internal Server Error !' });
				else if (results){

					const result = results[0];
					const flag = result['f'];
					const id_final = new Date() + flag._id;
					let flagServer = flag['properties'];
					flagServer.id = flag._id;

					const cypher_link_id_original = "MATCH (n:Flag) WHERE n.repeat_id_original= {repeat_id_original} "
					+ "SET n.repeat_id_original = {id_final}, "
					+ "n.day_start = {day_start}, "
					+ "n.month_start = {month_start}, "
					+ "n.year_start = {year_start}, "
					+ "n.day_end = {day_end}, "
					+ "n.month_end = {month_end}, "
					+ "n.year_end = {year_end} "
					+ "RETURN n";

					let j;

					for(j = 1; j <= repeat_qty; j++){
						db.cypher({
						    query: cypher_link_id_original,
						    params: {
						        repeat_id_original: id_original + j,
						        id_final: id_final,
						        day_start: day_list_start[j-1],
								month_start: month_list_start[j-1],
								year_start: year_list_start[j-1],
								day_end: day_list_end[j-1],
								month_end: month_list_end[j-1],
								year_end: year_list_end[j-1]
						    },
						}, (err, results) =>{
							if(err)
								reject({ status: 500, message: 'Internal Server Error !' });
							else{

								const result = results[0];
								const flag = result['n'];

								if(toAll && type){

									const cypher_all_friends_repeat = "MATCH (you:Profile {email:{creator}})-[:KNOWS]-(n:Profile) "
										+"MATCH (f) WHERE id(f)= {id} "
										+ "MERGE (n) -[:SIGNALIZED_TO { created : {created},  visualization_invitation_accepted : {visualization_invitation_accepted}, "
				    					+ "id_inviter : {id_inviter}, invitation : {invitation}, invite_date : {invite_date} }]-> (f) "
										+"RETURN n";

									db.cypher({
										    query: cypher_all_friends_repeat,
										    params: {
										        id: flag._id,
										        creator: creator,
												id_inviter: creator,
												created: false,
												visualization_invitation_accepted: false,
												invitation: 0,
												invite_date: dt_mili
										    },
											}, (err, results) =>{
												if(err)
													reject({ status: 500, message: 'Internal Server Error !' });
											});
								}else{
									v_guest.forEach( (guest) => {

							            db.cypher({
										    query: cypher_guest,
										    params: {
										        id: flag._id,
										        guest: guest,
												creator: creator,
												id_inviter: creator,
												created: false,
												visualization_invitation_accepted: false,
												invitation: 0,
												invite_date: dt_mili
										    },
										}, (err, results) =>{
											if(err)
												reject({ status: 500, message: 'Internal Server Error !' });
										});
						        	});	

								}

							}
						});
					}

					if(toAll && type){

						const cypher_all_friends = "MATCH (you:Profile {email:{email}})-[:KNOWS]-(n:Profile) "
										+"RETURN n";


						db.cypher({
						    query: cypher_all_friends,
						    params: {
							    email: creator
							},
						    lean: true
						}, (err, results) =>{
							if (err) 
						    	reject({ status: 500, message: 'Internal Server Error !' });
						    else if(results.length > 0){
						    	let usrs = [];

						    	results.forEach( (obj) => {
							    	const user = obj['n'];
						            usrs.push(user);
						        });

						        let n_solicitation;

								const cypher_device = "MATCH (p:Profile {email:{email}})-[:LOGGED_DEVICE]->(d:Device) "
													+ "OPTIONAL MATCH (p)-[r:SIGNALIZED_TO {visualization_invitation_accepted : {visualization_invitation_accepted}, invitation: {invitation}}]->(f:Flag) "
													+ "OPTIONAL MATCH (p)-[s:INVITED_TO {invitation_accepted_visualized : {invitation_accepted_visualized}, invitation: {invitation}}]->(a:Activity) "
													+ "RETURN d, size(collect(distinct r)), size(collect(distinct s)) ";


						        usrs.forEach(function (guest) {

						            db.cypher({
									    query: cypher_device,
									    params: {
										    email: guest.email,
										    invitation_accepted_visualized: false,
											visualization_invitation_accepted: false,
									    	invitation: 0
										},
									    lean: true
									}, (err, results) =>{
										if (err) 
									    	reject({ status: 500, message: 'Internal Server Error !' });
									    else if(results.length > 0){
									    	let registrationTokens = [];

									    	results.forEach( (obj) => {
										    	const device = obj['d'];
										    	n_solicitation = obj['size(collect(distinct r))'] + repeat_qty + obj['size(collect(distinct s))'];
									            registrationTokens.push(device.token);
									        });

									        let notification = {
											  data: {
											  	type: "invite",
											    name: "",
											    photo: "",
											    title: "",
											    n_solicitation: n_solicitation.toString()
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

						      
						    }
						});

					}else{
				        let n_solicitation;

						const cypher_device = "MATCH (p:Profile {email:{email}})-[:LOGGED_DEVICE]->(d:Device) "
													+ "OPTIONAL MATCH (p)-[r:SIGNALIZED_TO {visualization_invitation_accepted : {visualization_invitation_accepted}, invitation: {invitation}}]->(f:Flag) "
													+ "OPTIONAL MATCH (p)-[s:INVITED_TO {invitation_accepted_visualized : {invitation_accepted_visualized}, invitation: {invitation}}]->(a:Activity) "
													+ "RETURN d, size(collect(distinct r)), size(collect(distinct s)) ";


				        v_guest.forEach(function (guest) {

				            db.cypher({
							    query: cypher_device,
							    params: {
								    email: guest,
								    invitation_accepted_visualized: false,
									visualization_invitation_accepted: false,
							    	invitation: 0
								},
							    lean: true
							}, (err, results) =>{
								if (err) 
							    	reject({ status: 500, message: 'Internal Server Error !' });
							    else if(results.length > 0){
							    	let registrationTokens = [];

							    	results.forEach( (obj) => {
								    	const device = obj['d'];
								    	n_solicitation = obj['size(collect(distinct r))'] + obj['size(collect(distinct s))'];
							            registrationTokens.push(device.token);
							        });

							        let notification = {
									  data: {
									  	type: "invite",
									    name: "",
									    photo: "",
									    title: "",
									    n_solicitation: n_solicitation.toString()
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
					}

					resolve({ status: 201, message: 'Flag Resgistrada com sucesso!', flag: flagServer });		
				}

			});
		}

	});







