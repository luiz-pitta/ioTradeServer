'use strict';

const db = require('../models/Connection');

exports.getProfile = () => 
	
	new Promise((resolve,reject) => {

		let user;

		const cypher = "MATCH (p:Profile) "
					+"RETURN p ";

		db.cypher({
		    query: cypher,
		    lean: true
		}, (err, results) =>{
			if (err) 
		    	reject({ status: 500, message: 'Internal Server Error !' });
		    else{
		    	results.forEach(function (obj) {
		            let p = obj['p'];
		            user = p;
		        });

				resolve({ status: 201, user: user });
		    }
		    
		});

	});