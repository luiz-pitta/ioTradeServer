'use strict';

const db = require('../models/Connection');

exports.getBgProfile = () => 
	
	new Promise((resolve,reject) => {

		var result  = [];

		db.cypher({
		    query: 'MATCH (n:BgProfile) RETURN n',
		    lean: true
		}, (err, results) =>{
			if (err) {
		    	reject({ status: 500, message: 'Internal Server Error !' });
		    }

		    if (!results) {
		        reject({ status: 404, message: 'Não existem backgrounds :(' });
		    } else {
		        results.forEach( (obj) => {
		            const bgProfile = obj['n'];
		            result.push(bgProfile);
		        });
		        resolve({ status: 200, return: result }); 
		    }

		});
		
	});