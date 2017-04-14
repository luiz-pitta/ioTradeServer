'use strict';

const db = require('../models/Connection');

exports.getPastActivities = (email, month, year) => 
	
	new Promise((resolve,reject) => {

		var cypher = "MATCH (p:Profile {email: {email}})-[:INVITED_TO {invitation: 1}]->(a:Activity) "
			+"WHERE a.year_start = {year} AND a.month_start = {month} "
			+"RETURN a ORDER BY a.year_start, a.month_start,a.day_start LIMIT 1000";

		db.cypher({
		    query: cypher,
		    params: {
		        email: email,
	            month: month,
	            year: year		
		    }
		}, (err, results) =>{
			if (err) {
		    	reject({ status: 500, message: 'Internal Server Error !' });
		    }

		    var result  = [];
		    if (!results) {
		        reject({ status: 404, message: 'Usuário sem atividades passadas :(' });
		    } else {
		        results.forEach(function (obj) {
		            var act = obj['a'];
		            var real_act = act['properties'];
		            real_act.id = act._id;
		            result.push(real_act);
		        });
		    }

			resolve({ status: 200, return: result }); 
		});

	});