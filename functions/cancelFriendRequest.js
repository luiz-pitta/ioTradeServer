'use strict';

const db = require('../models/Connection');

exports.cancelFriendRequest = (email, email_friend) => 
	
	new Promise((resolve,reject) => {

		var cypher = "MATCH (friend:Profile {email: {email}})-[r:ASKED_TO_ADD]->(you:Profile {email: {email_friend}}) "
			+"DELETE r";

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
		    	resolve({ status: 200, message: 'Relação atualizada corretamente' }); 
		    
		});

	});