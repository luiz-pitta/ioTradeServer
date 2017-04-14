'use strict';

const db = require('../models/Connection');

exports.getCompare = (emails, d1, d1f, d2, m, a, m2, a2) => 
	
	new Promise((resolve,reject) => {

		var my_commit_act = [];
		var my_commit_flag = [];
		var email_user_friend = emails[0];

		var cypher_flag_red = "MATCH (n:Profile)-[:SIGNALIZED_TO{invitation:1}]->(f:Flag {type: false}) "
					+"WHERE n.email IN {emails} AND f.day_start >= {day} AND f.month_start = {month} AND f.year_start = {year} AND f.day_start <= {day2} "
					+"MATCH (c:Profile)-[:SIGNALIZED_TO {created: true}]->(f) "
					+"RETURN f, c.email, n.email";

		var cypher_flag_green = "MATCH (n:Profile)-[:SIGNALIZED_TO{invitation:1}]->(f:Flag {type: true}) "
					+"MATCH (p2:Profile {email: {email_user_friend}})-[:SIGNALIZED_TO]->(f) "
					+"WHERE n.email IN {emails} AND f.day_start >= {day} AND f.month_start = {month} AND f.year_start = {year} AND f.day_start <= {day2} "
					+"MATCH (c:Profile)-[:SIGNALIZED_TO {created: true}]->(f) "
					+"RETURN f, c.email, n.email";

		var cypher_act_public = "MATCH (n:Profile)-[:INVITED_TO{invitation:1, visibility:0}]->(a:Activity) "
					+"WHERE n.email IN {emails} AND a.day_start >= {day} AND a.month_start = {month} AND a.year_start = {year} AND a.day_start <= {day2} "
					+"MATCH (c:Profile)-[:INVITED_TO {created: true}]->(a) "
					+"RETURN a, c.email, n.email";

		var cypher_act_friend_only = "MATCH (n:Profile)-[:INVITED_TO{invitation:1, visibility:1}]->(a:Activity) "
					+"MATCH (p2:Profile {email: {email_user_friend}})-[:INVITED_TO]->(a) "
					+"WHERE n.email IN {emails} AND a.day_start >= {day} AND a.month_start = {month} AND a.year_start = {year} AND a.day_start <= {day2} "
					+"MATCH (c:Profile)-[:INVITED_TO {created: true}]->(a) "
					+"RETURN a, c.email, n.email";


		if(m == m2){

			db.cypher({
			    query: cypher_act_public,
			    params: {
				    emails: emails,
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
	            		var email_invited = obj['n.email'];
		    			real_act.email_invited = email_invited;
			            my_commit_act.push(real_act);
			        });
			    }

				db.cypher({
				    query: cypher_flag_red,
				    params: {
					    emails: emails,
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
			            	var email_invited = obj['n.email'];
				    		real_f.email_invited = email_invited;
				            my_commit_flag.push(real_f);
				        });
				    }

					db.cypher({
					    query: cypher_act_friend_only,
					    params: {
						    emails: emails,
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
			            		var email_invited = obj['n.email'];
				    			real_act.email_invited = email_invited;
					            my_commit_act.push(real_act);
					        });
					    }

					    db.cypher({
						    query: 'MATCH (n:Profile {email: {email}}) RETURN n',
						    params: {
							    email: emails[0]
							},
						    lean: true
						}, (err, results) =>{
							if (err) {
						    	reject({ status: 500, message: 'Internal Server Error !' });
						    }

						    var user  = results[0];
						    var result = user['n'];	

							db.cypher({
							    query: cypher_flag_green,
							    params: {
								    emails: emails,
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
			            				var email_invited = obj['n.email'];
				    					real_f.email_invited = email_invited;
							            my_commit_flag.push(real_f);
							        });
							    }

								resolve({ status: 200, my_commit_act: my_commit_act, my_commit_flag:my_commit_flag, user: result }); 
							});
						});
					});
				});
			});

		}else{

			db.cypher({
			    query: cypher_act_public,
			    params: {
				    emails: emails,
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
			            var email_invited = obj['n.email'];
				    	real_act.email_invited = email_invited;
			            my_commit_act.push(real_act);
			        });
			    }

			    

				db.cypher({
				    query: cypher_flag_red,
				    params: {
					    emails: emails,
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
			            	var email_invited = obj['n.email'];
							real_f.email_invited = email_invited;
				            my_commit_flag.push(real_f);
				        });
				    }


					db.cypher({
					    query: cypher_act_friend_only,
					    params: {
						    emails: emails,
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
			            		var email_invited = obj['n.email'];
								real_act.email_invited = email_invited;
					            my_commit_act.push(real_act);
					        });
					    }

					    

						db.cypher({
						    query: cypher_act_public,
						    params: {
							    emails: emails,
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
			            			var email_invited = obj['n.email'];
									real_act.email_invited = email_invited;
						            my_commit_act.push(real_act);
						        });
						    } 

							db.cypher({
							    query: cypher_flag_red,
							    params: {
								    emails: emails,
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
			            				var email_invited = obj['n.email'];
										real_f.email_invited = email_invited;
							            my_commit_flag.push(real_f);
							        });
							    }

							    

								db.cypher({
								    query: cypher_act_friend_only,
								    params: {
									    emails: emails,
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
			            					var email_invited = obj['n.email'];
											real_act.email_invited = email_invited;
								            my_commit_act.push(real_act);
								        });
								    }
									db.cypher({
									    query: cypher_flag_green,
									    params: {
										    emails: emails,
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
			            						var email_invited = obj['n.email'];
												real_f.email_invited = email_invited;
									            my_commit_flag.push(real_f);
									        });
									    }

										db.cypher({
										    query: cypher_flag_green,
										    params: {
											    emails: emails,
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
			            							var email_invited = obj['n.email'];
													real_f.email_invited = email_invited;
										            my_commit_flag.push(real_f);
										        });
										    }

											db.cypher({
											    query: 'MATCH (n:Profile {email: {email}}) RETURN n',
											    params: {
												    email: emails[0]
												},
											    lean: true
											}, (err, results) =>{
												if (err) {
											    	reject({ status: 500, message: 'Internal Server Error !' });
											    }

											    var user  = results[0];
											    var result = user['n'];		

												resolve({ status: 200, my_commit_act: my_commit_act, my_commit_flag:my_commit_flag, user: result }); 
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