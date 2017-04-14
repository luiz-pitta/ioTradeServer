'use strict';

const db = require('../models/Connection');

exports.blockPerson = (email, email_friend, type) => 
	
	new Promise((resolve,reject) => {

		var cypher;

		if(type == 0){
			cypher = "MATCH (p:Profile {email: {email}}), (p2:Profile {email: {email_friend}}) "
				+"MERGE (p)-[:BLOCKED]->(p2) "
				+"WITH  p, p2 "
				+"OPTIONAL MATCH (p)-[rel:KNOWS]-(p2) "
				+"OPTIONAL MATCH (p)-[rel2:ASKED_TO_ADD]-(p2) "
				+"OPTIONAL MATCH (p)-[rel3:HAS_AS_FAVORITE]-(p2) "
				+"DELETE rel, rel2, rel3";
		}else{
			cypher = "MATCH (p:Profile {email: {email}})-[rel:BLOCKED]->(p2:Profile {email: {email_friend}}) "
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
				resolve({ status: 200, message: 'Relação atualizada (block) corretamente' }); 
		});

	});