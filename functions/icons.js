'use strict';

const db = require('../models/Connection');

exports.getIcons = () => 
	
	new Promise((resolve,reject) => {

		let result  = [];
		const cypher = "MATCH (fb:Icon) WHERE fb.facebook = true OR fb.google_agenda = true "
					+"WITH collect(distinct fb) as icons "
					+"MATCH (n:Icon) WHERE NOT n IN icons "
					+"RETURN n ORDER BY n.url";

		db.cypher({
		    query: cypher,
		    lean: true
		}, (err, results) =>{
			if (err) {
		    	reject({ status: 500, message: 'Internal Server Error !' });
		    }

		    if (!results) {
		        reject({ status: 404, message: 'Não existem icons :(' });
		    } else {
		        results.forEach( (obj) => {
		            const icon = obj['n'];
		            result.push(icon);
		        });
		        resolve({ status: 200, return: result }); 
		    }

		});
		
	});