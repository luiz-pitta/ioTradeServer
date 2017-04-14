'use strict';

const db = require('../models/Connection');

exports.getSearchFilter = (email,query,popularity,day_start,month_start,year_start,
			day_end,month_end,year_end,minute_start,hour_start,minute_end,hour_end,tags,friends) => 
	
	new Promise((resolve,reject) => {

    	let whats_going_act =[];
    	let whats_going_flag =[];
    	let my_commit_act = [];
    	let my_commit_flag = [];
    	let my_commit_reminder = [];
    	let people = [];
    	let flag_down = false;
    	let reminder_down = false;

    	//Aba 'O que está Rolando'

    	let cypher_public_activity = "MATCH (p2:Profile)-[:INVITED_TO {visibility: 0, created : true}]->(a:Activity)-[:TAGGED_AS]->(t:Tag) "
			+ "MATCH (p:Profile {email: {email}})"
			+ "MATCH (n:Profile) WHERE ((n)-[:INVITED_TO]->(a) OR (n)-[:INVITED_TO {created : true}]->(a)) AND NOT (p)-[:INVITED_TO]->(a) AND a.title =~ {query} ";

		let cypher_participates_activity = "MATCH (p:Profile {email:{email}})-[:INVITED_TO {invitation:0}]->(a:Activity)-[:TAGGED_AS]->(t:Tag) "
			+ "MATCH (n:Profile)-[:INVITED_TO]->(a), (p2:Profile)-[:INVITED_TO {created : true}]->(a) "
			+ "WHERE a.title =~ {query} ";

		let cypher_participates_flag = "MATCH (p:Profile {email:{email}})-[:SIGNALIZED_TO {invitation:0}]->(f:Flag {type:true}) "
			+ "MATCH (n:Profile)-[:SIGNALIZED_TO]->(f) "
			+ "MATCH (p2:Profile)-[:SIGNALIZED_TO {created : true}]->(f) WHERE f.title =~ {query} ";

		//Aba 'Meus Compromissos'

		let cypher_my_activity = "MATCH (p:Profile {email:{email}})-[r:INVITED_TO]->(a:Activity)-[:TAGGED_AS]->(t:Tag) "
			+ "MATCH (n:Profile)-[:INVITED_TO]->(a) "
			+ "WHERE a.title =~ {query} AND (r.invitation = 1 OR r.invitation = 2) ";

		let cypher_my_flag = "MATCH (p:Profile {email:{email}})-[r:SIGNALIZED_TO]->(f:Flag) "
			+ "MATCH (n:Profile)-[:SIGNALIZED_TO]->(f) AND (r.invitation = 1 OR r.invitation = 2) "
			+ "WHERE f.title =~ {query} ";


		let cypher_my_reminder = "MATCH (p:Profile {email:{email}})-[:CREATED]->(r:Reminder) "
			+ "WHERE (r.year_start > {year_start} OR (r.year_start = {year_start} AND (r.month_start > {month_start} "
			+ "OR (r.month_start = {month_start} AND (r.day_start >= {day_start}))))) AND r.title =~ {query} AND"
            + "(r.hour_start > {hour_start} OR (r.hour_start = {hour_start} AND r.minute_start >= {minute_start})) "
			+ "RETURN r LIMIT 500";

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
			
		//Filtro

		if(day_start != -1){
			if(minute_start != -1){
				cypher_public_activity = cypher_public_activity 
					+ "AND (a.year_start > {year_start} OR (a.year_start = {year_start} AND (a.month_start > {month_start} OR (a.month_start = {month_start} AND (a.day_start >= {day_start} ))))) AND "
					+ "(a.year_end   < {year_end}   OR (a.year_end   = {year_end}   AND (a.month_end   < {month_end}   OR (a.month_end   = {month_end}   AND (a.day_end   <= {day_end}   ))))) AND "
					+ "(a.hour_end   < {hour_end}   OR (a.hour_end   = {hour_end}   AND a.minute_end   <= {minute_end})) AND "
					+ "(a.hour_start > {hour_start} OR (a.hour_start = {hour_start} AND a.minute_start >= {minute_start})) ";

				cypher_participates_activity = cypher_participates_activity 
					+ "AND (a.year_start > {year_start} OR (a.year_start = {year_start} AND (a.month_start > {month_start} OR (a.month_start = {month_start} AND (a.day_start >= {day_start} ))))) AND "
					+ "(a.year_end   < {year_end}   OR (a.year_end   = {year_end}   AND (a.month_end   < {month_end}   OR (a.month_end   = {month_end}   AND (a.day_end   <= {day_end}   ))))) AND "
					+ "(a.hour_end   < {hour_end}   OR (a.hour_end   = {hour_end}   AND a.minute_end   <= {minute_end})) AND "
					+ "(a.hour_start > {hour_start} OR (a.hour_start = {hour_start} AND a.minute_start >= {minute_start})) ";

				cypher_participates_flag = cypher_participates_flag 
					+ "AND (f.year_start > {year_start} OR (f.year_start = {year_start} AND (f.month_start > {month_start} OR (f.month_start = {month_start} AND (f.day_start >= {day_start} ))))) AND "
                    + "(f.year_end   < {year_end}   OR (f.year_end   = {year_end}   AND (f.month_end   < {month_end}   OR (f.month_end   = {month_end}   AND (f.day_end   <= {day_end}   ))))) AND "
                    + "(f.hour_end   < {hour_end}   OR (f.hour_end   = {hour_end}   AND f.minute_end   <= {minute_end})) AND "
                    + "(f.hour_start > {hour_start} OR (f.hour_start = {hour_start} AND f.minute_start >= {minute_start})) ";

                cypher_my_activity = cypher_my_activity 
					+ "AND (a.year_start > {year_start} OR (a.year_start = {year_start} AND (a.month_start > {month_start} OR (a.month_start = {month_start} AND (a.day_start >= {day_start} ))))) AND "
					+ "(a.year_end   < {year_end}   OR (a.year_end   = {year_end}   AND (a.month_end   < {month_end}   OR (a.month_end   = {month_end}   AND (a.day_end   <= {day_end}   ))))) AND "
					+ "(a.hour_end   < {hour_end}   OR (a.hour_end   = {hour_end}   AND a.minute_end   <= {minute_end})) AND "
					+ "(a.hour_start > {hour_start} OR (a.hour_start = {hour_start} AND a.minute_start >= {minute_start})) ";

				cypher_my_flag = cypher_my_flag 
					+ "AND (f.year_start > {year_start} OR (f.year_start = {year_start} AND (f.month_start > {month_start} OR (f.month_start = {month_start} AND (f.day_start >= {day_start} ))))) AND "
                    + "(f.year_end   < {year_end}   OR (f.year_end   = {year_end}   AND (f.month_end   < {month_end}   OR (f.month_end   = {month_end}   AND (f.day_end   <= {day_end}   ))))) AND "
                    + "(f.hour_end   < {hour_end}   OR (f.hour_end   = {hour_end}   AND f.minute_end   <= {minute_end})) AND "
                    + "(f.hour_start > {hour_start} OR (f.hour_start = {hour_start} AND f.minute_start >= {minute_start})) ";
			}else if((year_end - year_start) < 30){
				cypher_public_activity = cypher_public_activity
					+ "AND (a.year_start > {year_start} OR (a.year_start = {year_start} AND (a.month_start > {month_start} OR (a.month_start = {month_start} AND (a.day_start >= {day_start} ))))) AND "
					+ "(a.year_end   < {year_end}   OR (a.year_end   = {year_end}   AND (a.month_end   < {month_end}   OR (a.month_end   = {month_end}   AND (a.day_end   <= {day_end}   ))))) ";
				
				cypher_participates_activity = cypher_participates_activity
					+ "AND (a.year_start > {year_start} OR (a.year_start = {year_start} AND (a.month_start > {month_start} OR (a.month_start = {month_start} AND (a.day_start >= {day_start} ))))) AND "
					+ "(a.year_end   < {year_end}   OR (a.year_end   = {year_end}   AND (a.month_end   < {month_end}   OR (a.month_end   = {month_end}   AND (a.day_end   <= {day_end}   ))))) ";

				cypher_participates_flag = cypher_participates_flag
					+ "AND (f.year_start > {year_start} OR (f.year_start = {year_start} AND (f.month_start > {month_start} OR (f.month_start = {month_start} AND (f.day_start >= {day_start} ))))) AND "
            		+ "(f.year_end   < {year_end}   OR (f.year_end   = {year_end}   AND (f.month_end   < {month_end}   OR (f.month_end   = {month_end}   AND (f.day_end   <= {day_end}   ))))) ";
				
				cypher_my_activity = cypher_my_activity
					+ "AND (a.year_start > {year_start} OR (a.year_start = {year_start} AND (a.month_start > {month_start} OR (a.month_start = {month_start} AND (a.day_start >= {day_start} ))))) AND "
					+ "(a.year_end   < {year_end}   OR (a.year_end   = {year_end}   AND (a.month_end   < {month_end}   OR (a.month_end   = {month_end}   AND (a.day_end   <= {day_end}   ))))) ";

				cypher_my_flag = cypher_my_flag
					+ "AND (f.year_start > {year_start} OR (f.year_start = {year_start} AND (f.month_start > {month_start} OR (f.month_start = {month_start} AND (f.day_start >= {day_start} ))))) AND "
            		+ "(f.year_end   < {year_end}   OR (f.year_end   = {year_end}   AND (f.month_end   < {month_end}   OR (f.month_end   = {month_end}   AND (f.day_end   <= {day_end}   ))))) ";
			}
		}

		if(tags.length > 0){
			cypher_public_activity = cypher_public_activity 
					+ "AND t.title in {tags} ";

			cypher_participates_activity = cypher_participates_activity 
					+ "AND t.title in {tags} ";

			cypher_my_activity = cypher_my_activity 
					+ "AND t.title in {tags} ";

			flag_down = true;

			reminder_down = true;
		}

		if(friends.length > 0){
			cypher_public_activity = cypher_public_activity 
					+ "AND n.email IN {friends} ";

			cypher_participates_activity = cypher_participates_activity 
					+ "AND n.email IN {friends} ";

			cypher_participates_flag = cypher_participates_flag 
					+ "AND n.email IN {friends} ";

			cypher_my_activity = cypher_my_activity 
					+ "AND n.email IN {friends} ";

			cypher_my_flag = cypher_my_flag 
					+ "AND n.email IN {friends} ";

			reminder_down = true;
		}	


		cypher_public_activity = cypher_public_activity		
				+ "WITH count(n) as invited, a, n, p2 "
				+ "RETURN a, p2.name, count(n) ";

		cypher_participates_activity = cypher_participates_activity
				+ "WITH count(n) as invited, a, n, p2 "
				+ "RETURN a, p2.name, count(n) ";

		cypher_participates_flag = cypher_participates_flag
				+ "WITH count(n) as invited, f, n, p2 "
				+ "RETURN f, p2.name, count(n) ";

		cypher_my_activity = cypher_my_activity		
				+ "WITH count(n) as invited, a, n, p "
				+ "OPTIONAL MATCH (n)-[r:KNOWS]-(p) "
				+ "RETURN a, size(collect(distinct r)), count(n) ";

		cypher_my_flag = cypher_my_flag
				+ "WITH count(n) as invited, f, n, p "
				+ "OPTIONAL MATCH (n)-[r:KNOWS]-(p) "
				+ "RETURN f, size(collect(distinct r)), count(n) ";


		if(popularity){
			cypher_public_activity = cypher_public_activity
				+ "ORDER BY count(n) DESC ";

			cypher_participates_activity = cypher_participates_activity
				+ "ORDER BY count(n) DESC ";

			cypher_participates_flag = cypher_participates_flag
				+ "ORDER BY count(n) DESC ";

			cypher_my_activity = cypher_my_activity
				+ "ORDER BY count(n) DESC ";

			cypher_my_flag = cypher_my_flag
				+ "ORDER BY count(n) DESC ";

			reminder_down = true;	
		}

		cypher_public_activity = cypher_public_activity
			+ "LIMIT 500";

		cypher_participates_activity = cypher_participates_activity
			+ "LIMIT 500";

		cypher_participates_flag = cypher_participates_flag
			+ "LIMIT 500";

		cypher_my_activity = cypher_my_activity
			+ "LIMIT 500";

		cypher_my_flag = cypher_my_flag
			+ "LIMIT 500";

		if(flag_down){
			cypher_participates_flag = "MATCH (n) WHERE id(n)= -1 return n";

			cypher_my_flag = "MATCH (n) WHERE id(n)= -1 return n";
		}

		if(reminder_down){
			cypher_my_reminder = "MATCH (n) WHERE id(n)= -1 return n";
		}

		db.cypher({
		    query: cypher_public_activity,
		    params: {
		        email : email,
		        query : query, 
				day_start : day_start,
				month_start : month_start,
				year_start : year_start,
				day_end : day_end,
				month_end : month_end,
				year_end : year_end,
				minute_start : minute_start,
				hour_start : hour_start,
				minute_end : minute_end,
				hour_end : hour_end,
				tags : tags,
				friends : friends										
		    }
			}, (err, results) =>{
				if(err)
					reject({ status: 500, message: 'Internal Server Error !' });

				results.forEach( (obj) => {
		            const act = obj['a'];
		            const creator = obj['p2.name'];
		            const real_act = act['properties'];
		            real_act.id = act._id;
        			real_act.creator = creator;
		            whats_going_act.push(real_act);
		        });

		        db.cypher({
				    query: cypher_participates_activity,
				    params: {
				        email : email,
				        query : query,
						day_start : day_start,
						month_start : month_start,
						year_start : year_start,
						day_end : day_end,
						month_end : month_end,
						year_end : year_end,
						minute_start : minute_start,
						hour_start : hour_start,
						minute_end : minute_end,
						hour_end : hour_end,
						tags : tags,
						friends : friends											
				    }
					}, (err, results) =>{
						if(err)
							reject({ status: 500, message: 'Internal Server Error !' });

						results.forEach( (obj) => {
				            const act = obj['a'];
				            const real_act = act['properties'];
				            real_act.id = act._id;
				            const creator = obj['p2.name'];
				            real_act.creator = creator;
				            whats_going_act.push(real_act);
				        });

				        db.cypher({
						    query: cypher_participates_flag,
						    params: {
						        email : email,
						        query : query,
								day_start : day_start,
								month_start : month_start,
								year_start : year_start,
								day_end : day_end,
								month_end : month_end,
								year_end : year_end,
								minute_start : minute_start,
								hour_start : hour_start,
								minute_end : minute_end,
								hour_end : hour_end,
								friends : friends										
						    }
							}, (err, results) =>{
								if(err)
									reject({ status: 500, message: 'Internal Server Error !' });

								results.forEach( (obj) => {
						            const f = obj['f'];
						            const real_f = f['properties'];
			            			real_f.id = f._id;
			            			const creator = obj['p2.name'];
				            		real_f.creator = creator;
						            whats_going_flag.push(real_f);
						        });

						        db.cypher({
								    query: cypher_my_activity,
								    params: {
								        email : email,
								        query : query,
										day_start : day_start,
										month_start : month_start,
										year_start : year_start,
										day_end : day_end,
										month_end : month_end,
										year_end : year_end,
										minute_start : minute_start,
										hour_start : hour_start,
										minute_end : minute_end,
										hour_end : hour_end,
										tags : tags,
										friends : friends											
								    }
									}, (err, results) =>{
										if(err)
											reject({ status: 500, message: 'Internal Server Error !' });

										results.forEach( (obj) => {
								            const act = obj['a'];
								            const real_act = act['properties'];
								            real_act.id = act._id;
								            const count = obj['size(collect(distinct r))'];
				            				real_act.count_guest = count;
								            my_commit_act.push(real_act);
								        });

								        db.cypher({
										    query: cypher_my_flag,
										    params: {
										        email : email,
										        query : query,
												day_start : day_start,
												month_start : month_start,
												year_start : year_start,
												day_end : day_end,
												month_end : month_end,
												year_end : year_end,
												minute_start : minute_start,
												hour_start : hour_start,
												minute_end : minute_end,
												hour_end : hour_end,
												friends : friends											
										    }
											}, (err, results) =>{
												if(err)
													reject({ status: 500, message: 'Internal Server Error !' });

												results.forEach( (obj) => {
										            const f = obj['f'];
										            const real_f = f['properties'];
							            			real_f.id = f._id;
							            			const count = obj['size(collect(distinct r))'];
				            						real_f.count_guest = count;
										            my_commit_flag.push(real_f);
										        });

										        db.cypher({
												    query: cypher_my_reminder,
												    params: {
												        email : email,
												        query : query,
														day_start : day_start,
														month_start : month_start,
														year_start : year_start,
														minute_start : minute_start,
														hour_start : hour_start										
												    }
													}, (err, results) =>{
														if(err)
															reject({ status: 500, message: 'Internal Server Error !' });

														results.forEach( (obj) => {
												            const r = obj['r'];
												            const real_r = r['properties'];
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

														        resolve({ status: 200, message: "Query OK!", 
														        	whats_going_act: whats_going_act, 
														        	whats_going_flag: whats_going_flag, 
														        	my_commit_act: my_commit_act, 
														        	my_commit_flag: my_commit_flag, 
														        	my_commit_reminder: my_commit_reminder, 
														        	people: people }); 
																}
															});
													});
										        
											});
									});
							});
					});
			});
		
	});