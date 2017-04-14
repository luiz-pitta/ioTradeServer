'use strict';

const db = require('../models/Connection');

exports.getInviteRequest = (email, day, month, year, minute, hour) => 
	
	new Promise((resolve,reject) => {

		let my_commit_act  = [];
		let my_commit_flag = [];
		let whats_going_act  = [];
		let whats_going_flag = [];

		const cypher = "MATCH (n:Profile {email: {email}})-[s:INVITED_TO {invitation: 0}]->(a:Activity) "
			+"WHERE a.year_end > {year} OR (a.year_end = {year} AND (a.month_end > {month} OR (a.month_end = {month} AND (a.day_end > {day} "
			+"OR (a.day_end = {day} AND (a.hour_end > {hour} OR (a.hour_end = {hour} AND a.minute_end >= {minute}))))))) "
			+"WITH a, n, s "
			+"MATCH (p3:Profile)-[:INVITED_TO {invitation: 1}]->(a) "
			+"OPTIONAL MATCH (p3)-[r:KNOWS]-(n) "
			+"RETURN a, size(collect(distinct r)), s.invite_date LIMIT 5000";

		const cypher_flag = "MATCH (n:Profile {email: {email}})-[s:SIGNALIZED_TO {invitation: 0}]->(f:Flag) "
			+"WHERE f.year_end > {year} OR (f.year_end = {year} AND (f.month_end > {month} OR (f.month_end = {month} AND (f.day_end > {day} "
			+"OR (f.day_end = {day} AND (f.hour_end > {hour} OR (f.hour_end = {hour} AND f.minute_end >= {minute}))))))) "
			+"WITH f, n, s "
			+"MATCH (p3:Profile)-[:SIGNALIZED_TO {invitation: 1}]->(f) "
			+"OPTIONAL MATCH (p3)-[r:KNOWS]-(n) "
			+"RETURN f, size(collect(distinct r)), s.invite_date LIMIT 5000";

		const cypher_notification = "MATCH (n:Profile)-[s:INVITED_TO {invitation: 1, invitation_accepted_visualized: false, id_inviter: {email}}]->(a:Activity) "
			+"WHERE a.year_end > {year} OR (a.year_end = {year} AND (a.month_end > {month} OR (a.month_end = {month} AND (a.day_end > {day} "
			+"OR (a.day_end = {day} AND (a.hour_end > {hour} OR (a.hour_end = {hour} AND a.minute_end >= {minute}))))))) "
			+"RETURN a, n.name, s.invite_date LIMIT 2500";

		const cypher_flag_notification = "MATCH (n:Profile)-[s:SIGNALIZED_TO {invitation: 1, visualization_invitation_accepted: false, id_inviter: {email}}]->(f:Flag) "
			+"WHERE f.year_end > {year} OR (f.year_end = {year} AND (f.month_end > {month} OR (f.month_end = {month} AND (f.day_end > {day} "
			+"OR (f.day_end = {day} AND (f.hour_end > {hour} OR (f.hour_end = {hour} AND f.minute_end >= {minute}))))))) "
			+"RETURN f, n.name, s.invite_date LIMIT 2500";

		db.cypher({
		    query: cypher,
		    params: {
		        email: email,
	            day: day,
	            month: month,
	            year: year,	
	            minute: minute,
	            hour: hour
		    }
		}, (err, results) =>{
			if (err) {
		    	reject({ status: 500, message: 'Internal Server Error !' });
		    }

	        results.forEach(function (obj) {
	            const act = obj['a'];
	            const count = obj['size(collect(distinct r))'];
	            const date = obj['s.invite_date'];
	            let real_act = act['properties'];
	            real_act.id = act._id;
	            real_act.invite_date = date;
	            real_act.count_guest = count;
	            my_commit_act.push(real_act);
	        });
		    

			db.cypher({
			    query: cypher_flag,
			    params: {
			        email: email,
		            day: day,
		            month: month,
		            year: year,	
		            minute: minute,
		            hour: hour
			    }
			}, (err, results) =>{
				if (err) {
			    	reject({ status: 500, message: 'Internal Server Error !' });
			    }

		        results.forEach(function (obj) {
		            const flag = obj['f'];
		            const count = obj['size(collect(distinct r))'];
		            const date = obj['s.invite_date'];
		            let real_flag = flag['properties'];
		            real_flag.id = flag._id;
		            real_flag.count_guest = count;
		            real_flag.invite_date = date;
		            my_commit_flag.push(real_flag);
		        });
			    

				db.cypher({
				    query: cypher_notification,
				    params: {
				        email: email,
			            day: day,
			            month: month,
			            year: year,	
			            minute: minute,
			            hour: hour
				    }
				}, (err, results) =>{
					if (err) {
				    	reject({ status: 500, message: 'Internal Server Error !' });
				    }

			        results.forEach(function (obj) {
			            const act = obj['a'];
			            const name = obj['n.name'];
			            const date = obj['s.invite_date'];
			            let real_act = act['properties'];
			            real_act.id = act._id;
			            real_act.creator = name;
			            real_act.invite_date = date;
			            whats_going_act.push(real_act);
			        });
				    

					db.cypher({
					    query: cypher_flag_notification,
					    params: {
					        email: email,
				            day: day,
				            month: month,
				            year: year,	
				            minute: minute,
				            hour: hour
					    }
					}, (err, results) =>{
						if (err) {
					    	reject({ status: 500, message: 'Internal Server Error !' });
					    }

				        results.forEach(function (obj) {
				            const flag = obj['f'];
				            const name = obj['n.name'];
				            const date = obj['s.invite_date'];
				            let real_flag = flag['properties'];
				            real_flag.id = flag._id;
				            real_flag.creator = name;
				            real_flag.invite_date = date;
				            whats_going_flag.push(real_flag);
				        });
					    

						resolve({ status: 200, my_commit_act: my_commit_act, my_commit_flag:my_commit_flag, whats_going_act : whats_going_act, whats_going_flag: whats_going_flag }); 
					}); 
				});
			});
		});

	});