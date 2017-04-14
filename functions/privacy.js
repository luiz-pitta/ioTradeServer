'use strict';

const db = require('../models/Connection');

exports.setPrivacySettings = (email,privacy) => 
	
	new Promise((resolve,reject) => {

		var cypher = "MATCH (n:Profile {email: {email}}) "
				+ "SET n.privacy = {privacy} "
				+ "RETURN n";



		db.cypher({
		    query: cypher,
		    params: {
			  	email: email,
			  	privacy: privacy
		    },
		    lean: true
		}, (err, results) =>{
			if (err) 
		    	reject({ status: 500, message: 'Internal Server Error !' });
		    else{
				var user  = results[0];
			    var result = user['n'];

				resolve({ status: 200, return: result }); 
		    }
		});

	});