'use strict';

const db = require('../models/Connection');

exports.getBlockedUsers = email => 
	
	new Promise((resolve) => {

		let users = [];

		db.cypher({
		    query: 'MATCH (you:Profile {email: {email}})-[:BLOCKED]->(n:Profile) RETURN n',
		    params: {
			    email: email
			},
		    lean: true
		}, (err, results) =>{
			if (err) {
		    	reject({ status: 500, message: 'Internal Server Error !' });
		    }

		    results.forEach( (obj) => {
	            const user = obj['n'];
	            users.push(user);
	        });

			resolve({ status: 200, return: users }); 
		});

	});