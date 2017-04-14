'use strict';

const db = require('../models/Connection');

exports.getPlans = (email, d1, d1f, d2, m, a, m2, a2, email_user_friend, id_device) => 
	
	new Promise((resolve,reject) => {

		const dt = new Date();
		const dt_mili = dt.getTime();

		let my_commit_act = [];
		let my_commit_flag = [];
		let my_commit_reminder = [];
		let people_birthday = [];
		let user;

		const cypher_act = "MATCH (n:Profile {email: {email}})-[:INVITED_TO{invitation:1}]->(a:Activity) "
					+"MATCH (p2:Profile)-[:INVITED_TO {created : true}]->(a) "
					+"WHERE a.day_start >= {day} AND a.month_start = {month} AND a.year_start = {year} AND a.day_start <= {day2}"
					+"RETURN a, p2.email ORDER BY a.day_start, a.hour_start, a.minute_start";

		const cypher_flag = "MATCH (n:Profile {email: {email}})-[:SIGNALIZED_TO{invitation:1}]->(f:Flag) "
					+"MATCH (p2:Profile)-[:SIGNALIZED_TO {created : true}]->(f) "
					+"WHERE f.day_start >= {day} AND f.month_start = {month} AND f.year_start = {year} AND f.day_start <= {day2}"
					+"RETURN f, p2.email ORDER BY f.day_start, f.hour_start, f.minute_start";

		const cypher_reminder = "MATCH (n:Profile {email: {email}})-[:CREATED]->(r:Reminder) "
					+"WHERE r.day_start >= {day} AND r.month_start = {month} AND r.year_start = {year} AND r.day_start <= {day2} "
					+"RETURN r ORDER BY r.day_start, r.hour_start, r.minute_start";

		const cypher_person = "MATCH (n:Profile {email: {email}}), (you:Profile {email: {email_user_friend}}) "
					+"OPTIONAL MATCH (n)-[r:KNOWS]-(you) "
					+"OPTIONAL MATCH (n)-[s:ASKED_TO_ADD]-(you) "
					+"RETURN n, size(collect(distinct r)), size(collect(distinct s))";

		const cypher_people_birthday = "MATCH (you:Profile {email: {email}})-[r:KNOWS]-(n:Profile) "
					+"WHERE n.day_born >= {day} AND n.month_born = {month} AND n.day_born <= {day2} "
					+"RETURN n ";


		const cypher_update_last_time = "OPTIONAL MATCH (p:Profile {email:{email}})-[:LOGGED_DEVICE]->(d:Device {id_device:{id_device}}) "
					+"SET d.last_login_date_time = {last_login_date_time} RETURN d";

		db.cypher({
		    query: cypher_update_last_time,
		    params: {
			    email: email,
			    id_device: id_device,
	            last_login_date_time: dt_mili
			},
		    lean: true
		}, (err, results) =>{
			if (err) 
		    	reject({ status: 500, message: 'Internal Server Error !' });

		});



		if(m == m2){

			db.cypher({
			    query: cypher_act,
			    params: {
				    email: email,
				    day: d1,
				    day2: d2,
		            month: m,
		            year: a	
				}
			}, (err, results) =>{
				if (err) {
			    	reject({ status: 500, message: 'Internal Server Error !' });
			    }else if(results){
			    	results.forEach( (obj) => {
				    	const act = obj['a'];
			            let real_act = act['properties'];
			            real_act.id = act._id;
			            const creator = obj['p2.email'];
			            real_act.creator = creator;
			            my_commit_act.push(real_act);
			        });
			    }

				db.cypher({
				    query: cypher_flag,
				    params: {
					    email: email,
					    day: d1,
					    day2: d2,
			            month: m,
			            year: a	
					}
				}, (err, results) =>{
					if (err) {
				    	reject({ status: 500, message: 'Internal Server Error !' });
				    }else if(results){
				    	results.forEach( (obj) => {
					    	const f = obj['f'];
				            let real_f = f['properties'];
	            			real_f.id = f._id;
	            			const creator = obj['p2.email'];
			            	real_f.creator = creator;
				            my_commit_flag.push(real_f);
				        });
				    }

					db.cypher({
					    query: cypher_reminder,
					    params: {
						    email: email,
						    day: d1,
						    day2: d2,
				            month: m,
				            year: a	
						}
					}, (err, results) =>{
						if (err) {
					    	reject({ status: 500, message: 'Internal Server Error !' });
					    }else if(results){
					    	results.forEach( (obj) => {
						    	const rem = obj['r'];	 
					            let real_r = rem['properties'];
		            			real_r.id = rem._id;
					            my_commit_reminder.push(real_r);					            
					        });
					    }

					    db.cypher({
						    query: cypher_person,
						    params: {
							    email: email,
							    email_user_friend: email_user_friend

							}
						}, (err, results) =>{
							if (err) {
						    	reject({ status: 500, message: 'Internal Server Error !' });
						    }

						    if (!results) {
						        reject({ status: 404, message: 'Usuário sem amigos :(' });
						    } else {
						        results.forEach(function (obj) {
						            const p = obj['n'];
						            user = p['properties'];
						            const count = obj['size(collect(distinct r))'];
						            const count2 = obj['size(collect(distinct s))'];
						            user.count_knows = count;
						            user.count_ask_add = count2;
						        });
						    }	

							db.cypher({
							    query: cypher_people_birthday,
							    params: {
								    email: email,
								    day: d1,
								    day2: d2,
						            month: m
								}
							}, (err, results) =>{
								if (err) {
							    	reject({ status: 500, message: 'Internal Server Error !' });
							    }

						        results.forEach(function (obj) {
						            const birthday = obj['n'];
						            const user_birthday = birthday['properties'];
						            people_birthday.push(user_birthday);
						        });

								resolve({ status: 200, my_commit_act: my_commit_act, my_commit_flag:my_commit_flag, my_commit_reminder:my_commit_reminder, user: user, people: people_birthday }); 
							}); 
						});
					});
				});
			});

		}else{

			db.cypher({
			    query: cypher_act,
			    params: {
				    email: email,
				    day: d1,
				    day2: d1f,
		            month: m,
		            year: a	
				}
			}, (err, results) =>{
				if (err) {
			    	reject({ status: 500, message: 'Internal Server Error !' });
			    }else if(results){
			    	results.forEach( (obj) => {
				    	const act = obj['a'];
			            let real_act = act['properties'];
			            real_act.id = act._id;
			            const creator = obj['p2.email'];
			            real_act.creator = creator;
			            my_commit_act.push(real_act);
			        });
			    }

			    

				db.cypher({
				    query: cypher_flag,
				    params: {
					    email: email,
					    day: d1,
					    day2: d1f,
			            month: m,
			            year: a	
					}
				}, (err, results) =>{
					if (err) {
				    	reject({ status: 500, message: 'Internal Server Error !' });
				    }else if(results){
				    	results.forEach( (obj) => {
					    	const f = obj['f'];
				            let real_f = f['properties'];
	            			real_f.id = f._id;
	            			const creator = obj['p2.email'];
			            	real_f.creator = creator;
				            my_commit_flag.push(real_f);
				        });
				    }


					db.cypher({
					    query: cypher_reminder,
					    params: {
						    email: email,
						    day: d1,
						    day2: d1f,
				            month: m,
				            year: a	
						}
					}, (err, results) =>{
						if (err) {
					    	reject({ status: 500, message: 'Internal Server Error !' });
					    }else if(results){
					    	results.forEach( (obj) => {
						    	const rem = obj['r'];	 
					            let real_r = rem['properties'];
		            			real_r.id = rem._id;
					            my_commit_reminder.push(real_r);
					        });
					    }

					    

						db.cypher({
						    query: cypher_act,
						    params: {
							    email: email,
							    day: 1,
							    day2: d2,
					            month: m2,
					            year: a2	
							}
						}, (err, results) =>{
							if (err) {
						    	reject({ status: 500, message: 'Internal Server Error !' });
						    }else if(results){
						    	results.forEach( (obj) => {
							    	const act = obj['a'];
						            let real_act = act['properties'];
						            real_act.id = act._id;
						            const creator = obj['p2.email'];
			            			real_act.creator = creator;
						            my_commit_act.push(real_act);
						        });
						    } 

							db.cypher({
							    query: cypher_flag,
							    params: {
								    email: email,
								    day: 1,
								    day2: d2,
						            month: m2,
						            year: a2	
								}
							}, (err, results) =>{
								if (err) {
							    	reject({ status: 500, message: 'Internal Server Error !' });
							    }else if(results){
									results.forEach( (obj) => {
								    	const f = obj['f'];
							            let real_f = f['properties'];
				            			real_f.id = f._id;
				            			const creator = obj['p2.email'];
			            				real_f.creator = creator;
							            my_commit_flag.push(real_f);
							        });
							    }

							    

								db.cypher({
								    query: cypher_reminder,
								    params: {
									    email: email,
									    day: 1,
									    day2: d2,
							            month: m2,
							            year: a2	
									}
								}, (err, results) =>{
									if (err) {
								    	reject({ status: 500, message: 'Internal Server Error !' });
								    }else if(results){
								    	results.forEach( (obj) => {
									    	const rem = obj['r'];	 
								            let real_r = rem['properties'];
					            			real_r.id = rem._id;
								            my_commit_reminder.push(real_r);
								        });
								    }
									db.cypher({
									    query: cypher_person,
									    params: {
										    email: email,
										    email_user_friend: email_user_friend

										}
									}, (err, results) =>{
										if (err) {
									    	reject({ status: 500, message: 'Internal Server Error !' });
									    }

									    if (!results) {
									        reject({ status: 404, message: 'Usuário sem amigos :(' });
									    } else {
									        results.forEach(function (obj) {
									            const p = obj['n'];
									            user = p['properties'];
									            const count = obj['size(collect(distinct r))'];
									            const count2 = obj['size(collect(distinct s))'];
									            user.count_knows = count;
									            user.count_ask_add = count2;
									        });
									    }	

										db.cypher({
										    query: cypher_people_birthday,
										    params: {
											    email: email,
											    day: d1,
											    day2: d1f,
									            month: m

											}
										}, (err, results) =>{
											if (err) {
										    	reject({ status: 500, message: 'Internal Server Error !' });
										    }

									        results.forEach(function (obj) {
									            const birthday = obj['n'];
									            const user_birthday = birthday['properties'];
									            people_birthday.push(user_birthday);
									        });

											db.cypher({
											    query: cypher_people_birthday,
											    params: {
												    email: email,
												    day: 1,
												    day2: d2,
										            month: m2
												}
											}, (err, results) =>{
												if (err) {
											    	reject({ status: 500, message: 'Internal Server Error !' });
											    }

										        results.forEach(function (obj) {
										            const birthday = obj['n'];
										            const user_birthday = birthday['properties'];
										            people_birthday.push(user_birthday);
										        });

												resolve({ status: 200, my_commit_act: my_commit_act, my_commit_flag:my_commit_flag, my_commit_reminder:my_commit_reminder, user: user, people: people_birthday }); 
											}); 
										});
									});
								}); 
							});
						});
					});
				});
			});
		}

		

	});