'use strict';

const db = require('../models/Connection');

exports.getProfileInfoFragment = (email, day, month, year, minute_end, hour_end) => 
	
	new Promise((resolve,reject) => {

		let user;
		let my_commit_act =[];
		let my_commit_flag =[];
		let my_commit_reminder =[];
		let n_friend_request;
		let n_all_request_act;
		let n_all_request_flag;

		const cypher_profile = "MATCH (n:Profile {email: {email}}) RETURN n";

		const cypher_act = "MATCH (n:Profile {email: {email}})-[:INVITED_TO{invitation:1}]->(a:Activity) "
					+"WHERE a.day_start = {day} AND a.month_start = {month} AND a.year_start = {year} RETURN a "
					+"ORDER BY a.year_start, a.month_start,a.day_start";

		const cypher_flag = "MATCH (n:Profile {email: {email}})-[:SIGNALIZED_TO{invitation:1}]->(f:Flag) "
					+"WHERE f.day_start = {day} AND f.month_start = {month} AND f.year_start = {year} RETURN f "
					+"ORDER BY f.year_start, f.month_start,f.day_start";

		const cypher_reminder = "MATCH (n:Profile {email: {email}})-[:CREATED]->(r:Reminder) "
					+"WHERE r.day_start = {day} AND r.month_start = {month} AND r.year_start = {year} RETURN r "
					+"ORDER BY r.year_start, r.month_start,r.day_start";

		const cypher_friend_request = "MATCH (n:Profile)-[:ASKED_TO_ADD]->(you:Profile {email: {email}}) "
					+"RETURN count(n)";

		const cypher_all_request_act = "MATCH (you:Profile {email: {email}})-[:INVITED_TO{invitation:0}]->(a:Activity) " 
					+"WHERE a.year_end > {year} OR (a.year_end = {year} AND (a.month_end > {month} OR (a.month_end = {month} AND (a.day_end > {day} "
					+"OR (a.day_end = {day} AND (a.hour_end > {hour_end} OR (a.hour_end = {hour_end} AND a.minute_end >= {minute_end}))))))) "
					+"RETURN count(a)";

		const cypher_all_request_flag = "MATCH (you:Profile {email: {email}})-[:SIGNALIZED_TO{invitation:0}]->(f:Flag) "
					+"WHERE f.year_end > {year} OR (f.year_end = {year} AND (f.month_end > {month} OR (f.month_end = {month} AND (f.day_end > {day} "
					+"OR (f.day_end = {day} AND (f.hour_end > {hour_end} OR (f.hour_end = {hour_end} AND f.minute_end >= {minute_end}))))))) "
					+"RETURN count(f)";

		const cypher_update_request_act = "MATCH (n:Profile)-[r:INVITED_TO{invitation:0, id_inviter : {email}}]->(a:Activity) " 
					+"WHERE a.year_end < {year} OR (a.year_end = {year} AND (a.month_end < {month} OR (a.month_end = {month} AND (a.day_end < {day} "
					+"OR (a.day_end = {day} AND (a.hour_end < {hour_end} OR (a.hour_end = {hour_end} AND a.minute_end < {minute_end}))))))) "
					+"SET r.invitation_accepted_visualized = true "
					+"RETURN count(a)";

		const cypher_update_request_flag = "MATCH (n:Profile)-[r:SIGNALIZED_TO{invitation:0, id_inviter : {email}}]->(f:Flag) "
					+"WHERE f.year_end < {year} OR (f.year_end = {year} AND (f.month_end < {month} OR (f.month_end = {month} AND (f.day_end < {day} "
					+"OR (f.day_end = {day} AND (f.hour_end < {hour_end} OR (f.hour_end = {hour_end} AND f.minute_end < {minute_end}))))))) "
					+"SET r.visualization_invitation_accepted = true "
					+"RETURN count(f)";

		db.cypher({
		    query: cypher_profile,
		    params: {
			    email: email
			},
		    lean: true
		}, (err, results) =>{
			if (err) {
		    	reject({ status: 500, message: 'Internal Server Error !' });
		    }else if(results){
		    	user = results[0]['n'];
		    }

		    db.cypher({
			    query: cypher_act,
			    params: {
				    email: email,
				    day: day,
		            month: month,
		            year: year	
				},
			    lean: true
			}, (err, results) =>{
				if (err) {
			    	reject({ status: 500, message: 'Internal Server Error !' });
			    }else if(results){
			    	results.forEach( (obj) => {
				    	var act = obj['a'];
			            my_commit_act.push(act);
			        });
			    }

			    db.cypher({
				    query: cypher_friend_request,
				    params: {
					    email: email
					},
				    lean: true
				}, (err, results) =>{
					if (err) {
				    	reject({ status: 500, message: 'Internal Server Error !' });
				    }else if(results){
				    	n_friend_request = results[0]['count(n)'];
				    }

				    db.cypher({
					    query: cypher_all_request_act,
					    params: {
						    email: email,
						    day: day,
				            month: month,
				            year: year,
				            minute_end: minute_end,
				            hour_end: hour_end		
						},
					    lean: true
					}, (err, results) =>{
						if (err) {
					    	reject({ status: 500, message: 'Internal Server Error !' });
					    }else if(results){
					    	n_all_request_act = results[0]['count(a)'];
					    }

						db.cypher({
						    query: cypher_all_request_flag,
						    params: {
							    email: email,
							    day: day,
					            month: month,
					            year: year,
				            	minute_end: minute_end,
				            	hour_end: hour_end	
							},
						    lean: true
						}, (err, results) =>{
							if (err) {
						    	reject({ status: 500, message: 'Internal Server Error !' });
						    }else if(results){
						    	n_all_request_flag = results[0]['count(f)'];
						    }

							db.cypher({
							    query: cypher_flag,
							    params: {
								    email: email,
								    day: day,
						            month: month,
						            year: year	
								},
							    lean: true
							}, (err, results) =>{
								if (err) {
							    	reject({ status: 500, message: 'Internal Server Error !' });
							    }else if(results){
							    	results.forEach( (obj) => {
								    	var f = obj['f'];
							            my_commit_flag.push(f);
							        });
							    }

								db.cypher({
								    query: cypher_reminder,
								    params: {
									    email: email,
									    day: day,
							            month: month,
							            year: year	
									},
								    lean: true
								}, (err, results) =>{
									if (err) {
								    	reject({ status: 500, message: 'Internal Server Error !' });
								    }else if(results){
								    	results.forEach( (obj) => {
									    	const r = obj['r'];
								            my_commit_reminder.push(r);
								        });
								    }

									db.cypher({
									    query: cypher_update_request_act,
									    params: {
										    email: email,
										    day: day,
								            month: month,
								            year: year,
							            	minute_end: minute_end,
							            	hour_end: hour_end		
										},
									    lean: true
									}, (err, results) =>{
										if (err) 
									    	reject({ status: 500, message: 'Internal Server Error !' });
									    

										db.cypher({
										    query: cypher_update_request_flag,
										    params: {
											    email: email,
											    day: day,
									            month: month,
									            year: year,
								            	minute_end: minute_end,
								            	hour_end: hour_end		
											},
										    lean: true
										}, (err, results) =>{
											if (err) 
										    	reject({ status: 500, message: 'Internal Server Error !' });
										    

											resolve({ status: 200, user: user,  
												my_commit_act: my_commit_act, 
												my_commit_flag: my_commit_flag, 
												my_commit_reminder: my_commit_reminder,
												n_friend_request: n_friend_request, 
												n_all_request_act: n_all_request_act, 
												n_all_request_flag:n_all_request_flag}); 
										}); 
									}); 
								}); 
							}); 
						});
					});
				});
			});
		});

	});