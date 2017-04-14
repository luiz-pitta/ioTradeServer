'use strict';

const db = require('../models/Connection');

exports.getImportedGoogle = (email) => 
	
	new Promise((resolve,reject) => {

		let whats_going_act  = [];
		let icon;

		const cypher = "MATCH (you:Profile {email: {email}})-[:INVITED_TO {created : true}]->(a:Activity) "
					+"WHERE a.id_google > 0 "
					+"RETURN a";


		db.cypher({
		    query: cypher,
		    params: {
		        email: email
		    },
		    lean: true
		}, (err, results) =>{
			if (err) {
		    	reject({ status: 500, message: 'Internal Server Error !' });
		    }

	        results.forEach(function (act) {
	            const activity = act['a'];
	            whats_going_act.push(activity);
	        });
		   

			db.cypher({
			    query: 'MATCH (n:Icon {google_agenda:true}) return n',
			    lean: true
			}, (err, results) =>{
				if (err) {
			    	reject({ status: 500, message: 'Internal Server Error !' });
			    }

		        results.forEach(function (ic) {
		            icon = ic['n'];
		        });
			   

				resolve({ status: 200, whats_going_act: whats_going_act, icon:icon }); 
			});
		});

	});