'use strict';

const db = require('../models/Connection');

exports.getInterests = () => 
	
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
		        reject({ status: 404, message: 'There are no interests :(' });
		    } else {
		        results.forEach( (obj) => {
		            var interests = obj['n'];
		            result.push(interests);
		        });
		        resolve({ status: 200, return: result }); 
		    }

		});
		
	});