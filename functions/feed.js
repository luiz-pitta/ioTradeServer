'use strict';

const db = require('../models/Connection');
const firebase = require('../models/Firebase');

exports.getFeedActivities = (email, day, month, year, minute, hour, id_device) => 
	
	new Promise((resolve,reject) => {

		const dt = new Date();
		const dt_mili = dt.getTime();

    	let whats_going_act =[];
    	let whats_going_flag =[];

    	//TESTANDO NOVO BRANCH

    	const cypher_public_activity = "MATCH (p2:Profile)-[:INVITED_TO {created : true}]->(a:Activity)  "
    		+"MATCH (p:Profile {email:{email}}) "
    		+"MATCH (p3:Profile) "
			+"WHERE (p3)-[:INVITED_TO]->(a) AND (NOT (p2)-[:BLOCKED]-(p)) AND a.invitation_type = 2 AND "
			+"(a.year_end > {year} OR (a.year_end = {year} AND (a.month_end > {month} OR (a.month_end = {month} AND (a.day_end > {day} "
			+"OR (a.day_end = {day} AND (a.hour_end > {hour} OR (a.hour_end = {hour} AND a.minute_end >= {minute})))))))) "
			+"WITH count(p3) as invited, a, p3, p, p2 "
			+"OPTIONAL MATCH (p3)-[r:KNOWS]-(p) "
			+"OPTIONAL MATCH (p)-[know:KNOWS]-(p2) "
			+"OPTIONAL MATCH (p)-[fav:HAS_AS_FAVORITE]->(p2) "
			+"RETURN a, p2, size(collect(distinct r)), size(collect(distinct know)), size(collect(distinct fav)) LIMIT 2500";

		const cypher_participates_activity = "MATCH (a:Activity) "
			+"MATCH (p:Profile {email:{email}})-[:INVITED_TO]->(a) "
			+"MATCH (p2:Profile)-[:INVITED_TO {created : true}]->(a) "
			+"WHERE (a.year_end > {year} OR (a.year_end = {year} AND (a.month_end > {month} OR (a.month_end = {month} AND (a.day_end > {day} "
			+"OR (a.day_end = {day} AND (a.hour_end > {hour} OR (a.hour_end = {hour} AND a.minute_end >= {minute})))))))) "
			+"MATCH (p3:Profile)-[:INVITED_TO]->(a) "
			+"OPTIONAL MATCH (p3)-[r:KNOWS]-(p) "
			+"OPTIONAL MATCH (p)-[know:KNOWS]-(p2) "
			+"OPTIONAL MATCH (p)-[fav:HAS_AS_FAVORITE]->(p2) "
			+"RETURN a, p2, size(collect(distinct r)), size(collect(distinct know)), size(collect(distinct fav)) LIMIT 1500";

		const cypher_participates_flag = "MATCH (f:Flag {type:true}) "
			+"MATCH (p:Profile {email:{email}})-[:SIGNALIZED_TO]->(f) "
			+"MATCH (p2:Profile)-[:SIGNALIZED_TO {created : true}]->(f) "
			+"WHERE (f.year_end > {year} OR (f.year_end = {year} AND (f.month_end > {month} OR (f.month_end = {month} AND (f.day_end > {day} "
			+"OR (f.day_end = {day} AND (f.hour_end > {hour} OR (f.hour_end = {hour} AND f.minute_end >= {minute})))))))) "
			+"MATCH (p3:Profile)-[:SIGNALIZED_TO]->(f) "
			+"OPTIONAL MATCH (p3)-[r:KNOWS]-(p) "
			+"OPTIONAL MATCH (p)-[know:KNOWS]-(p2) "
			+"OPTIONAL MATCH (p)-[fav:HAS_AS_FAVORITE]->(p2) "
			+"RETURN f, p2, size(collect(distinct r)), size(collect(distinct know)), size(collect(distinct fav)) LIMIT 1000";


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
			console.log(err);
			if (err) 
		    	reject({ status: 500, message: 'Internal Server Error !' });
		});


		db.cypher({
		    query: cypher_public_activity,
		    params: {
		        email: email,
	            day: day,
	            month: month,
	            year: year,
	            hour: hour,
	            minute: minute											
		    }
			}, (err, results) =>{
				console.log(err);
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
				        email: email,
			            day: day,
			            month: month,
			            year: year,
			            hour: hour,
			            minute: minute												
				    }
					}, (err, results) =>{
						console.log(err);
						if(err)
							reject({ status: 500, message: 'Internal Server Error !' });

						results.forEach( (obj) => {
				            const act = obj['a'];
				            const p2 = obj['p2'];
		            		const count = obj['size(collect(distinct r))'];
		            		const count2 = obj['size(collect(distinct know))'];
		            		const count3 = obj['size(collect(distinct fav))'];
				            const real_act = act['properties'];
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
						        email: email,
					            day: day,
					            month: month,
					            year: year,
					            hour: hour,
					            minute: minute												
						    }
							}, (err, results) =>{
								console.log(err);
								if(err)
									reject({ status: 500, message: 'Internal Server Error !' });
								else{
									results.forEach( (obj) => {
							            const f = obj['f'];
							            const p2 = obj['p2'];
		            					const count = obj['size(collect(distinct r))'];
		            					const count2 = obj['size(collect(distinct know))'];
		            					const count3 = obj['size(collect(distinct fav))'];
							            const real_f = f['properties'];
							            const real_p2 = p2['properties'];
				            			real_f.id = f._id;
				            			real_f.user = real_p2;
				            			real_f.count_guest = count;
        								real_f.know_creator = count2;
        								real_f.favorite_creator = count3;
							            whats_going_flag.push(real_f);
							        });

							        resolve({ status: 200, message: "Feed OK!", whats_going_act: whats_going_act, whats_going_flag: whats_going_flag }); 
								}
							});
					});
			});
		
	});