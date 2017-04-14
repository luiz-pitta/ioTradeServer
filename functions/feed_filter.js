'use strict';

const db = require('../models/Connection');

exports.getFeedFilter = (email,popularity,day_start,month_start,year_start,
			day_end,month_end,year_end,minute_start,hour_start,minute_end,hour_end,tags,friends) => 
	
	new Promise((resolve,reject) => {

		let flag_down = false;
    	let whats_going_act =[];
    	let whats_going_flag =[];

		let cypher_public_activity = "MATCH (p2:Profile)-[:INVITED_TO {visibility: 0, created : true}]->(a:Activity)-[:TAGGED_AS]->(t:Tag) "
			+ "MATCH (p:Profile {email: {email}}) "
			+ "MATCH (n:Profile) WHERE (n)-[:INVITED_TO]->(a) AND NOT (p)-[:INVITED_TO]->(a) ";

		let cypher_participates_activity = "MATCH (p:Profile {email:{email}}) "
			+ "MATCH (n:Profile)-[:INVITED_TO]->(a:Activity)-[:TAGGED_AS]->(t:Tag) "
			+ "MATCH (p2:Profile)-[:INVITED_TO {created : true}]->(a) WHERE (p)-[:INVITED_TO {invitation:0}]->(a) ";

		let cypher_participates_flag = "MATCH (p:Profile {email:{email}}) "
			+ "MATCH (n:Profile)-[:SIGNALIZED_TO]->(f) "
			+ "MATCH (p2:Profile)-[:SIGNALIZED_TO {created : true}]->(f:Flag {type:true}) WHERE (p)-[:SIGNALIZED_TO {invitation:0}]->(f) ";

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
			}else{
				cypher_public_activity = cypher_public_activity
					+ "AND (a.year_start > {year_start} OR (a.year_start = {year_start} AND (a.month_start > {month_start} OR (a.month_start = {month_start} AND (a.day_start >= {day_start} ))))) AND "
					+ "(a.year_end   < {year_end}   OR (a.year_end   = {year_end}   AND (a.month_end   < {month_end}   OR (a.month_end   = {month_end}   AND (a.day_end   <= {day_end}   ))))) ";
				
				cypher_participates_activity = cypher_participates_activity
					+ "AND (a.year_start > {year_start} OR (a.year_start = {year_start} AND (a.month_start > {month_start} OR (a.month_start = {month_start} AND (a.day_start >= {day_start} ))))) AND "
					+ "(a.year_end   < {year_end}   OR (a.year_end   = {year_end}   AND (a.month_end   < {month_end}   OR (a.month_end   = {month_end}   AND (a.day_end   <= {day_end}   ))))) ";

				cypher_participates_flag = cypher_participates_flag
					+ "AND (f.year_start > {year_start} OR (f.year_start = {year_start} AND (f.month_start > {month_start} OR (f.month_start = {month_start} AND (f.day_start >= {day_start} ))))) AND "
            		+ "(f.year_end   < {year_end}   OR (f.year_end   = {year_end}   AND (f.month_end   < {month_end}   OR (f.month_end   = {month_end}   AND (f.day_end   <= {day_end}   ))))) ";
			}
		}

		if(tags.length > 0){
			cypher_public_activity = cypher_public_activity 
					+ "AND t.title in {tags} ";

			cypher_participates_activity = cypher_participates_activity 
					+ "AND t.title in {tags} ";

			flag_down = true;
		}

		if(friends.length > 0){
			cypher_public_activity = cypher_public_activity 
					+ "AND n.email IN {friends} ";

			cypher_participates_activity = cypher_participates_activity 
					+ "AND n.email IN {friends} ";

			cypher_participates_flag = cypher_participates_flag 
					+ "AND n.email IN {friends} ";
		}

		cypher_public_activity = cypher_public_activity		
				+ "WITH count(n) as invited, a, n, p, p2 "
				+ "OPTIONAL MATCH (n)-[r:KNOWS]-(p) "
				+ "OPTIONAL MATCH (p)-[know:KNOWS]-(p2) "
				+ "OPTIONAL MATCH (p)-[fav:HAS_AS_FAVORITE]->(p2) "
				+ "RETURN a, p2, size(collect(distinct r)), size(collect(distinct know)), size(collect(distinct fav)), count(n) ";

		cypher_participates_activity = cypher_participates_activity
				+ "WITH count(n) as invited, a, n, p, p2 "
				+ "OPTIONAL MATCH (n)-[r:KNOWS]-(p) "
				+ "OPTIONAL MATCH (p)-[know:KNOWS]-(p2) "
				+ "OPTIONAL MATCH (p)-[fav:HAS_AS_FAVORITE]->(p2) "
				+ "RETURN a, p2, size(collect(distinct r)), size(collect(distinct know)), size(collect(distinct fav)), count(n) ";

		cypher_participates_flag = cypher_participates_flag
				+ "WITH count(n) as invited, f, n, p, p2 "
				+ "OPTIONAL MATCH (n)-[r:KNOWS]-(p) "
				+ "OPTIONAL MATCH (p)-[know:KNOWS]-(p2) "
				+ "OPTIONAL MATCH (p)-[fav:HAS_AS_FAVORITE]->(p2) "
				+ "RETURN f, p2, size(collect(distinct r)), size(collect(distinct know)), size(collect(distinct fav)), count(n) ";

		if(popularity){
			cypher_public_activity = cypher_public_activity
				+ "ORDER BY count(n) DESC ";

			cypher_participates_activity = cypher_participates_activity
				+ "ORDER BY count(n) DESC ";

			cypher_participates_flag = cypher_participates_flag
				+ "ORDER BY count(n) DESC ";
		}

		cypher_public_activity = cypher_public_activity
			+ "LIMIT 2500";

		cypher_participates_activity = cypher_participates_activity
			+ "LIMIT 2500";

		cypher_participates_flag = cypher_participates_flag
			+ "LIMIT 2500";

		if(flag_down){
			cypher_participates_flag = "MATCH (n) WHERE id(n)= -1 return n";
		}

		db.cypher({
		    query: cypher_public_activity, 
		    params: {
		        email : email,
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
		            const p2 = obj['p2'];
		            const count = obj['size(collect(distinct r))'];
		            const count2 = obj['size(collect(distinct know))'];
		            const count3 = obj['size(collect(distinct fav))'];
		            let real_act = act['properties'];
		            const real_p2 = p2['properties'];
		            real_act.id = act._id;
		            real_act.user = real_p2;
        			real_act.count_guest = count;
        			real_act.know_creator = count2;
        			real_act.favorite_creator = count3;
		            whats_going_act.push(real_act);
		        });

		        db.cypher({
				    query: cypher_participates_activity,
				    params: {
				        email : email,
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
				            const p2 = obj['p2'];
		            		const count = obj['size(collect(distinct r))'];
		           			const count2 = obj['size(collect(distinct know))'];
		            		const count3 = obj['size(collect(distinct fav))'];
				            let real_act = act['properties'];
				            const real_p2 = p2['properties'];
				            real_act.id = act._id;
				            real_act.user = real_p2;
	            			real_act.count_guest = count;
        					real_act.know_creator = count2;
        					real_act.favorite_creator = count3;
				            whats_going_act.push(real_act);
				        });

				        db.cypher({
						    query: cypher_participates_flag,
						    params: {
						        email : email,
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
								else{
									results.forEach( (obj) => {
							            const f = obj['f'];
							            const p2 = obj['p2'];
		            					const count = obj['size(collect(distinct r))'];
		           						const count2 = obj['size(collect(distinct know))'];
		            					const count3 = obj['size(collect(distinct fav))'];
							            let real_f = f['properties'];
							            const real_p2 = p2['properties'];
				            			real_f.id = f._id;
				            			real_f.user = real_p2;
				            			real_f.count_guest = count;
        								real_f.know_creator = count2;
        								real_f.favorite_creator = count3;
							            whats_going_flag.push(real_f);
							        });

							        resolve({ status: 200, message: "Feed Filter OK!", whats_going_act: whats_going_act, whats_going_flag: whats_going_flag }); 
								}
							});
					});
			});
		
	});