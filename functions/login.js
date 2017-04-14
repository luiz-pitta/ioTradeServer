'use strict';

const db = require('../models/Connection');
const bcrypt = require('bcryptjs');

exports.loginUser = (email, password) => 

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

			var result  = results[0];
		    if(!result){
		    	reject({ status: 404, message: 'User Not Found !' });
		    }
		    else{
		    	
		    	var user = result['n'];
				const hashed_password = user.hashed_password;

				if (bcrypt.compareSync(password, hashed_password)) {

					resolve({ status: 200, user: user });

				} else {

					reject({ status: 401, message: 'Invalid Credentials !' });
				}
			}

		});

	});

	
