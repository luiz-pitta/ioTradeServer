'use strict';

const db = require('../models/Connection');

exports.getInterest = () => 
	
	new Promise((resolve,reject) => {

		var result  = [];

		db.cypher({
		    query: 'MATCH (n:Interest) RETURN n',
		    lean: true
		}, (err, results) =>{
			if (err) {
		    	reject({ status: 500, message: 'Internal Server Error !' });
		    }

		    if (!results) {
		        reject({ status: 404, message: 'Não existem Interest :(' });
		    } else {
		        results.forEach( (obj) => {
		            var interest = obj['n'];
		            result.push(interest);
		        });
		        resolve({ status: 200, return: result }); 
		    }

		});
		
	});