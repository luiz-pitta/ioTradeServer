'use strict';

const db = require('../models/Connection');

exports.visualizeFriendRequest = (email) => 

	new Promise((resolve,reject) => {
		
		db.cypher({
		    query: 'OPTIONAL MATCH (n:Profile)<-[r:KNOWS {visualization_invitation_accepted: false}]-(you:Profile {email: {email}}) SET r.visualization_invitation_accepted = true RETURN you',
		    params: {
		        email: email
		    },
			}, (err, results) =>{
				if(err)
					reject({ status: 500, message: 'Internal Server Error !' });
				else {
					db.cypher({
					    query: 'OPTIONAL MATCH (n:Profile)-[r:ASKED_TO_ADD {visualization_invitation_accepted: false}]->(you:Profile {email: {email}}) SET r.visualization_invitation_accepted = true RETURN you',
					    params: {
					        email: email
					    },
						}, (err, results) =>{
							if(err)
								reject({ status: 500, message: 'Internal Server Error !' });
							else 
								resolve({ status: 201, message: 'Sucesso' });
						});
				}
			});


	});