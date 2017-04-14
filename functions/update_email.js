'use strict';

const db = require('../models/Connection');
const bcrypt = require('bcryptjs');

exports.updateEmail = (email, email_new) => 

	new Promise((resolve,reject) => {

		const cypher_update = "MATCH (n:Profile {email: {email}}) "
				+ "SET n.email = {email_new} "
				+ "RETURN n";

		db.cypher({
		    query: 'MATCH (n:Profile {email: {email_new}}) RETURN n',
		    params: {
			    email_new: email_new
			},
		    lean: true
		}, (err, results) =>{
			if (err) {
		    	reject({ status: 500, message: 'Internal Server Error !' });
		    }

			const result  = results[0];
		    if(result){
		    	reject({ status: 404, message: 'Usuário já existe!' });
		    }
		    else{
		    	
		    	db.cypher({
				    query: cypher_update,
				    params: {
					    email: email,
					    email_new: email_new

					},
				    lean: true
				}, (err, results) =>{
					if (err) 
				    	reject({ status: 500, message: 'Internal Server Error !' });
				    else{
				    	const result  = results[0];
				    	const user = result['n'];
						resolve({ status: 200, user: user });
				    }

				});
			}

		});

	});

	
