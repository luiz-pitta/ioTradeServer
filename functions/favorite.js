'use strict';

const db = require('../models/Connection');

exports.favoritePerson = (email, email_friend, type) => 
	
	new Promise((resolve,reject) => {

		let cypher;

		if(type == 0){
			cypher = "MATCH (p:Profile {email: {email}})-[KNOWS]-(p2:Profile {email: {email_friend}}) "
				+"MERGE (p)-[:HAS_AS_FAVORITE]->(p2) "
				+"RETURN p";
		}else{
			cypher = "MATCH (p:Profile {email: {email}})-[rel:HAS_AS_FAVORITE]->(p2:Profile {email: {email_friend}}) "
				+"DELETE rel";
		}



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
				resolve({ status: 200, message: 'Relação atualizada (fav) corretamente' }); 
		});

	});