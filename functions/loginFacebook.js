'use strict';

const db = require('../models/Connection');

exports.loginUserFacebook = (email, id_facebook, name, day_born, month_born, year_born, lives_in, gender, photo) => 

	new Promise((resolve,reject) => { //TODO verificar se email do facebook, bate com alguma conta criada pelo app

		let cypher_update_facebook = "MATCH (n:Profile {id_facebook: {id_facebook}}) "
				+ "SET n.email = {email}, "
				+ "n.day_born = {day_born}, "
				+ "n.month_born = {month_born}, "
				+ "n.year_born = {year_born}, "
				+ "n.lives_in = {lives_in}, ";

		db.cypher({
		    query: 'MATCH (n:Profile) WHERE n.id_facebook= {id_facebook} RETURN n',
		    params: {
			    id_facebook: id_facebook
			},
		    lean: true
		}, (err, results) =>{
			if (err) {
		    	reject({ status: 500, message: 'Internal Server Error !' });
		    }
			const result  = results[0];

		    if(!result){
		    	db.cypher({
				    query: 'MATCH (n:Profile {email: {email}}) RETURN n',
				    params: {
				        email: email
				    },
				    lean: true
				}, (err, results) =>{
					if (err) 
				    	reject({ status: 500, message: 'Internal Server Error !' });
				    else{
				    	const result  = results[0];
				    	if(!result)
							reject({ status: 404, message: 'register' });
						else{
							const usr = result['n'];
				    		resolve({ status: 200, user: usr });
						}
				    }
				});
		    }
		    else{

		    	const user = result['n'];	

		    	if(!user.modify_facebook_photo)
		    		cypher_update_facebook = cypher_update_facebook + "n.photo = {photo}, ";

		    	if(!user.modify_facebook_name)
		    		cypher_update_facebook = cypher_update_facebook + "n.name = {name}, ";

		    	cypher_update_facebook = cypher_update_facebook + "n.gender = {gender} RETURN n";

		    	db.cypher({
				    query: cypher_update_facebook,
				    params: {
					    id_facebook: id_facebook,
					    email: email,
						name: name, 
						day_born: day_born, 
						month_born: month_born, 
						year_born: year_born, 
						lives_in: lives_in, 
						gender: gender, 
						photo: photo
					},
				    lean: true
				}, (err, results) =>{
					if (err) {
				    	reject({ status: 500, message: 'Internal Server Error !' });
				    }

					const result  = results[0];
				    if(!result)
				    	reject({ status: 404, message: 'register' });
				    else{
				    	const usr = result['n'];
				    	resolve({ status: 200, user: usr });
				    }
					
				});
		    }
			
		});

	});

	
