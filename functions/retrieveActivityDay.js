'use strict';

const db = require('../models/Connection');

exports.getAtivityOfTheDay = (email, day, month, year) => 
	
	new Promise((resolve,reject) => {

		var my_commit_act = [];
		var my_commit_flag = [];
		var my_commit_reminder = [];

		var cypher_act = "MATCH (n:Profile {email: {email}})-[:INVITED_TO{invitation:1}]->(a:Activity) "
					+"MATCH (p2:Profile)-[:INVITED_TO{invitation:1}]->(a) "
					+"WHERE a.day_start = {day} AND a.month_start = {month} AND a.year_start = {year} RETURN a, count(p2) "
					+"ORDER BY a.hour_start, a.minute_start";

		var cypher_flag = "MATCH (n:Profile {email: {email}})-[:SIGNALIZED_TO{invitation:1}]->(f:Flag) "
					+"MATCH (p2:Profile)-[:SIGNALIZED_TO{invitation:1}]->(f) "
					+"WHERE f.day_start = {day} AND f.month_start = {month} AND f.year_start = {year} RETURN f, count(p2) "
					+"ORDER BY f.hour_start, f.minute_start";

		var cypher_reminder = "MATCH (n:Profile {email: {email}})-[:CREATED]->(r:Reminder) "
					+"WHERE r.day_start = {day} AND r.month_start = {month} AND r.year_start = {year} RETURN r "
					+"ORDER BY r.hour_start, r.minute_start";

		db.cypher({
		    query: cypher_act,
		    params: {
			    email: email,
			    day: day,
	            month: month,
	            year: year	
			}
		}, (err, results) =>{
			if (err) {
		    	reject({ status: 500, message: 'Internal Server Error !' });
		    }

		    results.forEach( (obj) => {
		    	var act = obj['a'];
	            var real_act = act['properties'];
	            real_act.id = act._id;
	            var count = obj['count(p2)'];	          
				real_act.count_guest = count;
	            my_commit_act.push(real_act);
	        });

			db.cypher({
			    query: cypher_flag,
			    params: {
				    email: email,
				    day: day,
		            month: month,
		            year: year	
				}
			}, (err, results) =>{
				if (err) {
			    	reject({ status: 500, message: 'Internal Server Error !' });
			    }

			    results.forEach( (obj) => {
			    	var f = obj['f'];
		            var real_f = f['properties'];
        			real_f.id = f._id;
        			var count = obj['count(p2)'];
				    real_f.count_guest = count;
		            my_commit_flag.push(real_f);
		        });

				db.cypher({
				    query: cypher_reminder,
				    params: {
					    email: email,
					    day: day,
			            month: month,
			            year: year	
					}
				}, (err, results) =>{
					if (err) {
				    	reject({ status: 500, message: 'Internal Server Error !' });
				    }

				    results.forEach( (obj) => {
				    	var r = obj['r'];
			            var real_r = r['properties'];
	        			real_r.id = r._id;
			            my_commit_reminder.push(real_r);
			        });

					resolve({ status: 200, my_commit_act: my_commit_act, my_commit_flag:my_commit_flag, my_commit_reminder:my_commit_reminder }); 
				});
			});
		});

	});