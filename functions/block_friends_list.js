'use strict';

const db = require('../models/Connection');

exports.blockPeople = (email, emails) => 
	
	new Promise((resolve,reject) => {

		const cypher = "MATCH (p:Profile {email: {email}})-[rel:KNOWS]-(p2:Profile {email: {email_friend}}) "
			+"MERGE (p)-[:BLOCKED]->(p2) "
			+"WITH  p, p2, rel "
			+"OPTIONAL MATCH (p)-[rel2:HAS_AS_FAVORITE]-(p2) "
			+"DELETE rel, rel2";

		emails.forEach( (email_friend) => {	

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
			});

		});

		resolve({ status: 200, message: 'Relação atualizada (block) corretamente' });

	});