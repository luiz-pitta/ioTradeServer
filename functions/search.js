'use strict';

const db = require('../models/Connection');

exports.getSearchResults = (email, day, month, year, query) => 
	
	new Promise((resolve,reject) => {

    	let whats_going_act =[];
    	let whats_going_flag =[];
    	let my_commit_act = [];
    	let my_commit_flag = [];
    	let my_commit_reminder = [];
    	let people = [];

    	//Aba 'O que está Rolando'

    	console.log(query);

		const cypher_public_activity = "MATCH (p2:Profile)-[INVITED_TO {created : true}]->(a:Activity), (p:Profile {email:{email}}) "
			+"WHERE a.title =~ {query} AND (NOT (p)-[:INVITED_TO]->(a)) AND (NOT (p2)-[:BLOCKED]-(p)) AND a.invitation_type = 2 "
			+"RETURN a, p2.name LIMIT 500";

		const cypher_participates_activity = "MATCH (a:Activity) "
			+"MATCH (p:Profile {email:{email}})-[:INVITED_TO {invitation:0}]->(a) "
			+"MATCH (p2:Profile)-[:INVITED_TO {created : true}]->(a) "
			+"WHERE a.title =~ {query} "
			+"RETURN a, p2.name LIMIT 500";

		const cypher_participates_flag = "MATCH (f:Flag {type:true}) "
			+"MATCH (p:Profile {email:{email}})-[:SIGNALIZED_TO {invitation:0}]->(f) "
			+"MATCH (p2:Profile)-[:SIGNALIZED_TO {created : true}]->(f) "
			+"WHERE f.title =~ {query} "
			+"RETURN f, p2.name LIMIT 500";

		//Aba 'Meus Compromissos'

		const cypher_my_activity = "MATCH (p:Profile {email:{email}})-[r:INVITED_TO]->(a:Activity) "
			+"WHERE a.title =~ {query} AND (r.invitation = 1 OR r.invitation = 2) "
			+"MATCH (p2:Profile)-[:INVITED_TO]->(a) "
			+"MATCH (p3:Profile)-[:INVITED_TO {created : true}]->(a) "
			+"OPTIONAL MATCH (p2)-[r:KNOWS]-(p) "
			+"RETURN a, p3.name, p3.email, size(collect(distinct r)) LIMIT 500";

		const cypher_my_flag = "MATCH (p:Profile {email:{email}})-[r:SIGNALIZED_TO]->(f:Flag) "
			+"WHERE f.title =~ {query} AND (r.invitation = 1 OR r.invitation = 2) "
			+"MATCH (p2:Profile)-[:SIGNALIZED_TO]->(f) "
			+"MATCH (p3:Profile)-[:SIGNALIZED_TO {created : true}]->(f) "
			+"OPTIONAL MATCH (p2)-[r:KNOWS]-(p) "
			+"RETURN f, p3.name, p3.email, size(collect(distinct r)) LIMIT 500";

		const cypher_my_reminder = "MATCH (p:Profile {email:{email}})-[:CREATED]->(r:Reminder) "
			+"WHERE r.title =~ {query}  "
			+"RETURN r LIMIT 500";

		//Aba 'Pessoas'

		const cypher_people = "MATCH (you:Profile {email: {email}}) "
			+"OPTIONAL MATCH (you)-[:BLOCKED]-(p3:Profile) "
			+"WITH collect(distinct p3) as blocks, you "
			+"MATCH (p:Profile), (n2:Profile) "
			+"WHERE p.name =~ {query} AND NOT p.email = {email} "
			+"AND NOT n2.email= {email} AND NOT p IN blocks " 
			+"OPTIONAL MATCH (p)-[:KNOWS]-(n2)-[t:KNOWS]-(you) " 
			+"OPTIONAL MATCH (p)-[r:KNOWS]-(you) "
			+"OPTIONAL MATCH (p)-[s:ASKED_TO_ADD]-(you) "
			+"OPTIONAL MATCH (p)-[z:ASKED_TO_ADD]->(you) "
			+"OPTIONAL MATCH (you)-[f:HAS_AS_FAVORITE]->(p) "
			+"WITH p, size(collect(distinct r)) as know, size(collect(distinct s)) as ask, size(collect(distinct t)) as common, size(collect(distinct z)) as logins, size(collect(distinct f)) as favorite "
			+"WITH know, ask, common, logins, favorite, p ORDER BY p.name ASC "
			+"WITH know, ask, common, logins, favorite, p ORDER BY common DESC "
			+"WITH know, ask, common, logins, favorite, p ORDER BY ask DESC "
			+"WITH know, ask, common, logins, favorite, p ORDER BY know DESC "
			+"WITH know, ask, common, logins, favorite, p ORDER BY favorite DESC "
			+"RETURN p, favorite, know, ask, common, logins LIMIT 500";


		db.cypher({
		    query: cypher_public_activity,
		    params: {
		        email: email,
	            query: query										
		    }
			}, (err, results) =>{
				if(err)
					reject({ status: 500, message: 'Internal Server Error !' });

				results.forEach( (obj) => {
					console.log(obj);
		            const act = obj['a'];
		            const creator = obj['p2.name'];
		            let real_act = act['properties'];
		            real_act.id = act._id;
        			real_act.creator = creator;
		            whats_going_act.push(real_act);
		        });

		        db.cypher({
				    query: cypher_participates_activity,
				    params: {
				        email: email,
			            query: query											
				    }
					}, (err, results) =>{
						if(err)
							reject({ status: 500, message: 'Internal Server Error !' });

						results.forEach( (obj) => {
				            const act = obj['a'];
				            let real_act = act['properties'];
				            real_act.id = act._id;
				            const creator = obj['p2.name'];
				            real_act.creator = creator;
				            whats_going_act.push(real_act);
				        });

				        db.cypher({
						    query: cypher_participates_flag,
						    params: {
						        email: email,
					            query: query										
						    }
							}, (err, results) =>{
								if(err)
									reject({ status: 500, message: 'Internal Server Error !' });

								results.forEach( (obj) => {
						            const f = obj['f'];
						            let real_f = f['properties'];
			            			real_f.id = f._id;
			            			const creator = obj['p2.name'];
				            		real_f.creator = creator;
						            whats_going_flag.push(real_f);
						        });

						        db.cypher({
								    query: cypher_my_activity,
								    params: {
								        email: email,
							            query: query										
								    }
									}, (err, results) =>{
										if(err)
											reject({ status: 500, message: 'Internal Server Error !' });

										results.forEach( (obj) => {
								            const act = obj['a'];
								            let real_act = act['properties'];
		            						const creator = obj['p3.name'];
		            						const creator_email = obj['p3.email'];
								            real_act.id = act._id;
								            const count = obj['size(collect(distinct r))'];
				            				real_act.count_guest = count;
				            				real_act.creator = creator;
				            				real_act.creator_email = creator_email;
								            my_commit_act.push(real_act);
								        });

								        db.cypher({
										    query: cypher_my_flag,
										    params: {
										        email: email,
									            query: query										
										    }
											}, (err, results) =>{
												if(err)
													reject({ status: 500, message: 'Internal Server Error !' });

												results.forEach( (obj) => {
										            const f = obj['f'];
										            let real_f = f['properties'];
		            								const creator = obj['p3.name'];
		            								const creator_email = obj['p3.email'];
							            			real_f.id = f._id;
							            			const count = obj['size(collect(distinct r))'];
				            						real_f.count_guest = count;
				            						real_f.creator = creator;
				            						real_f.creator_email = creator_email;
										            my_commit_flag.push(real_f);
										        });

										        db.cypher({
												    query: cypher_my_reminder,
												    params: {
												        email: email,
											            query: query											
												    }
													}, (err, results) =>{
														if(err)
															reject({ status: 500, message: 'Internal Server Error !' });

														results.forEach( (obj) => {
												            const r = obj['r'];
												            let real_r = r['properties'];
							            					real_r.id = r._id;
												            my_commit_reminder.push(real_r);

												        });

												        db.cypher({
														    query: cypher_people,
														    params: {
													            query: query,
													            email: email										
														    }
															}, (err, results) =>{
																if(err)
																	reject({ status: 500, message: 'Internal Server Error !' });
																else{

																	results.forEach( (obj) => {
															            const p = obj['p'];
															            let real_p = p['properties'];
															            const count = obj['know'];
															            const count2 = obj['ask'];
															            const count3 = obj['common'];
															            const count4 = obj['logins'];
															            const count5 = obj['favorite'];
															            real_p.count_knows = count;
															            real_p.count_ask_add = count2;
															            real_p.count_common = count3;
															            real_p.qty_successfully_logins = count4;
															            real_p.count_favorite = count5;
															            people.push(real_p);
															        });

														        resolve({ status: 200, message: "Query OK!", whats_going_act: whats_going_act, whats_going_flag: whats_going_flag, my_commit_act: my_commit_act, my_commit_flag: my_commit_flag, my_commit_reminder: my_commit_reminder, people: people }); 
																}
															});
													});
										        
											});
									});
							});
					});
			});
		
	});

