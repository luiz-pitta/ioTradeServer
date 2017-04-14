'use strict';

const db = require('../models/Connection');

exports.getBgFeed = () => 
	
	new Promise((resolve,reject) => {

		var result  = [];

		db.cypher({
		    query: 'MATCH (n:BgFeed) RETURN n',
		    lean: true
		}, (err, results) =>{
			if (err) {
		    	reject({ status: 500, message: 'Internal Server Error !' });
		    }

		    if (!results) {
		        reject({ status: 404, message: 'Não existem backgrounds :(' });
		    } else {
		        results.forEach( (obj) => {
		            const bgFeed = obj['n'];
		            result.push(bgFeed);
		        });
		        resolve({ status: 200, return: result }); 
		    }

		});
		
	});