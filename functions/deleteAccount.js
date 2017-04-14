'use strict';

const db = require('../models/Connection');

exports.deleteAccount = (email) => 
	
	new Promise((resolve,reject) => {

		const cypher = "MATCH (n:Profile {email: {email}}) "
				+ "DETACH DELETE n ";



		db.cypher({
		    query: cypher,
		    params: {
			  	email: email
		    },
		    lean: true
		}, (err, results) =>{
			if (err) 
		    	reject({ status: 500, message: 'Internal Server Error !' });
		    else
				resolve({ status: 200, message: 'Contato excluído !' }); 
		});

	});