'use strict';

const db = require('../models/Connection');

exports.getFriendsPlans = (email, d1, d1f, d2, m, a, m2, a2, email_user_friend) => 
	
	new Promise((resolve,reject) => {

		var my_commit_act = [];
		var my_commit_flag = [];
		var user = [];

		var cypher_flag_red = "MATCH (n:Profile {email: {email}})-[:SIGNALIZED_TO{invitation:1}]->(f:Flag {type: false}) "
					+"MATCH (c:Profile)-[:SIGNALIZED_TO {created : true}]->(f) "
					+"WHERE f.day_start >= {day} AND f.month_start = {month} AND f.year_start = {year} AND f.day_start <= {day2} "
					+"RETURN f, c.email ORDER BY f.day_start, f.hour_start, f.minute_start";

		var cypher_flag_green = "MATCH (n:Profile {email: {email}})-[:SIGNALIZED_TO{invitation:1}]->(f:Flag {type: true}) "
					+"MATCH (p2:Profile {email: {email_user_friend}})-[:SIGNALIZED_TO]->(f) "
					+"WHERE f.day_start >= {day} AND f.month_start = {month} AND f.year_start = {year} AND f.day_start <= {day2} "
					+"MATCH (c:Profile)-[:SIGNALIZED_TO {created : true}]->(f) "
					+"RETURN f, c.email ORDER BY f.day_start, f.hour_start, f.minute_start";

		var cypher_act_public = "MATCH (n:Profile {email: {email}})-[:INVITED_TO{invitation:1, visibility:0}]->(a:Activity) "
					+"WHERE a.day_start >= {day} AND a.month_start = {month} AND a.year_start = {year} AND a.day_start <= {day2} "
					+"MATCH (c:Profile)-[:INVITED_TO {created : true}]->(a) "
					+"RETURN a, c.email ORDER BY a.day_start, a.hour_start, a.minute_start";

		var cypher_act_friend_only = "MATCH (n:Profile {email: {email}})-[:INVITED_TO{invitation:1, visibility:1}]->(a:Activity) "
					+"MATCH (p2:Profile {email: {email_user_friend}})-[:INVITED_TO]->(a) "
					+"WHERE a.day_start >= {day} AND a.month_start = {month} AND a.year_start = {year} AND a.day_start <= {day2} "
					+"MATCH (p2)-[:KNOWS]->(n) "
					+"MATCH (c:Profile)-[:INVITED_TO {created : true}]->(a) "
					+"RETURN a, c.email ORDER BY a.day_start, a.hour_start, a.minute_start";

		var cypher_person = "MATCH (n:Profile {email: {email}}), (you:Profile {email: {email_user_friend}}) "
					+"OPTIONAL MATCH (n)-[r:KNOWS]-(you) "
					+"OPTIONAL MATCH (n)-[s:ASKED_TO_ADD]-(you) "
					+"OPTIONAL MATCH (n)-[t:ASKED_TO_ADD]->(you) "
					+"RETURN n, size(collect(distinct r)), size(collect(distinct s)), size(collect(distinct t))";

		if(m == m2){

			db.cypher({
			    query: cypher_act_public,
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
				    	var act = obj['a'];
			            var real_act = act['properties'];
			            real_act.id = act._id;
			            var creator = obj['c.email'];
			            real_act.creator = creator;
			            my_commit_act.push(real_act);
			        });
			    }

				db.cypher({
				    query: cypher_flag_red,
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
					    	var f = obj['f'];
				            var real_f = f['properties'];
	            			real_f.id = f._id;
	            			var creator = obj['c.email'];
			            	real_f.creator = creator;
				            my_commit_flag.push(real_f);
				        });
				    }

					db.cypher({
					    query: cypher_act_friend_only,
					    params: {
						    email: email,
						    email_user_friend: email_user_friend,
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
						    	var act = obj['a'];
					            var real_act = act['properties'];
					            real_act.id = act._id;
					            var creator = obj['c.email'];
			            		real_act.creator = creator;
					            my_commit_act.push(real_act);
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

						    var user;

						    if (!results) {
						        reject({ status: 404, message: 'Usuário sem amigos :(' });
						    } else {
						        results.forEach(function (obj) {
						            var p = obj['n'];
						            user = p['properties'];
						            var count = obj['size(collect(distinct r))'];
						            var count2 = obj['size(collect(distinct s))'];
						            var count3 = obj['size(collect(distinct t))'];
						            user.count_knows = count;
						            user.count_ask_add = count2;
						            user.count_common = count3;
						        });
						    }	

							db.cypher({
							    query: cypher_flag_green,
							    params: {
								    email: email,
								    email_user_friend: email_user_friend,
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
								    	var f = obj['f'];
							            var real_f = f['properties'];
				            			real_f.id = f._id;
				            			var creator = obj['c.email'];
			            				real_f.creator = creator;
							            my_commit_flag.push(real_f);
							        });
							    }

								resolve({ status: 200, my_commit_act: my_commit_act, my_commit_flag:my_commit_flag, user: user }); 
							});
						});
					});
				});
			});

		}else{

			db.cypher({
			    query: cypher_act_public,
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
				    	var act = obj['a'];
			            var real_act = act['properties'];
			            real_act.id = act._id;
			            var creator = obj['c.email'];
			            real_act.creator = creator;
			            my_commit_act.push(real_act);
			        });
			    }

			    

				db.cypher({
				    query: cypher_flag_red,
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
					    	var f = obj['f'];
				            var real_f = f['properties'];
	            			real_f.id = f._id;
	            			var creator = obj['c.email'];
			            	real_f.creator = creator;
				            my_commit_flag.push(real_f);
				        });
				    }


					db.cypher({
					    query: cypher_act_friend_only,
					    params: {
						    email: email,
						    email_user_friend: email_user_friend,
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
						    	var act = obj['a'];
					            var real_act = act['properties'];
					            real_act.id = act._id;
					            var creator = obj['c.email'];
			            		real_act.creator = creator;
					            my_commit_act.push(real_act);
					        });
					    }

					    

						db.cypher({
						    query: cypher_act_public,
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
							    	var act = obj['a'];
						            var real_act = act['properties'];
						            real_act.id = act._id;
						            var creator = obj['c.email'];
			            			real_act.creator = creator;
						            my_commit_act.push(real_act);
						        });
						    } 

							db.cypher({
							    query: cypher_flag_red,
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
								    	var f = obj['f'];
							            var real_f = f['properties'];
				            			real_f.id = f._id;
				            			var creator = obj['c.email'];
			            				real_f.creator = creator;
							            my_commit_flag.push(real_f);
							        });
							    }

							    

								db.cypher({
								    query: cypher_act_friend_only,
								    params: {
									    email: email,
									    email_user_friend: email_user_friend,
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
									    	var act = obj['a'];
								            var real_act = act['properties'];
								            real_act.id = act._id;
								            var creator = obj['c.email'];
			            					real_act.creator = creator;
								            my_commit_act.push(real_act);
								        });
								    }
									db.cypher({
									    query: cypher_flag_green,
									    params: {
										    email: email,
										    email_user_friend: email_user_friend,
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
										    	var f = obj['f'];
									            var real_f = f['properties'];
						            			real_f.id = f._id;
						            			var creator = obj['c.email'];
			            						real_f.creator = creator;
									            my_commit_flag.push(real_f);
									        });
									    }

										db.cypher({
										    query: cypher_flag_green,
										    params: {
											    email: email,
											    email_user_friend: email_user_friend,
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
											    	var f = obj['f'];
										            var real_f = f['properties'];
							            			real_f.id = f._id;
							            			var creator = obj['c.email'];
			            							real_f.creator = creator;
										            my_commit_flag.push(real_f);
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

											    var user;

											    if (!results) {
											        reject({ status: 404, message: 'Usuário sem amigos :(' });
											    } else {
											        results.forEach(function (obj) {
											            var p = obj['n'];
											            user = p['properties'];
											            var count = obj['size(collect(distinct r))'];
											            var count2 = obj['size(collect(distinct s))'];
											            var count3 = obj['size(collect(distinct t))'];
											            user.count_knows = count;
											            user.count_ask_add = count2;
											            user.count_common = count3;
											        });
											    }	

												resolve({ status: 200, my_commit_act: my_commit_act, my_commit_flag:my_commit_flag, user: user }); 
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