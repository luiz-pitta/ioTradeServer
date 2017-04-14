'use strict';

const db = require('../models/Connection');

exports.deletePerson = (email, email_friend) => 
	
	new Promise((resolve,reject) => {

		var cypher = "MATCH (p:Profile {email: {email}})-[rel:KNOWS]-(p2:Profile {email: {email_friend}}) "
				+"OPTIONAL MATCH (p)-[rel2:HAS_AS_FAVORITE]-(p2) "
				+"DELETE rel, rel2";


		db.cypher({
		    query: cypher,
		    params: {
		        email: email,
		        email_friend: email_friend
		    },
		    lean: true
		}, (err, results) =>{
			if (err) 
		    	reject({ status: 500, message: 'Internal Server Error !' });
		    else
				resolve({ status: 200, message: 'Relação atualizada (del) corretamente' }); 
		});

	});