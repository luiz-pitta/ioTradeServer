'use strict';

const db = require('../models/Connection');

exports.getProfile = email => 
	
	new Promise((resolve,reject) => {

		db.cypher({
		    query: 'MATCH (n:Profile {email: {email}}) RETURN n',
		    params: {
			    email: email
			},
		    lean: true
		}, (err, results) =>{
			if (err) {
		    	reject({ status: 500, message: 'Internal Server Error !' });
		    }

		    var user  = results[0];
		    var result = user['n'];

			resolve({ status: 200, return: result }); 
		});

	});