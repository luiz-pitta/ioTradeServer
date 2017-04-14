'use strict';

const db = require('../models/Connection');

exports.visualizeInviteRequest = (email) => 

	new Promise((resolve,reject) => {

		const cypher_activity = "OPTIONAL MATCH (n:Profile)-[r:INVITED_TO {invitation_accepted_visualized: false, id_inviter : {email}}]->(a:Activity) "
		+ "SET r.invitation_accepted_visualized = true RETURN n";

		const cypher_flag = "OPTIONAL MATCH (n:Profile)-[r:SIGNALIZED_TO {visualization_invitation_accepted: false, id_inviter : {email}}]->(f:Flag) "
		+ "SET r.visualization_invitation_accepted = true RETURN n";
		
		db.cypher({
		    query: cypher_activity,
		    params: {
		        email: email
		    },
			}, (err, results) =>{
				console.log(err);
				if(err)
					reject({ status: 500, message: 'Internal Server Error !' });
				else {
					db.cypher({
					    query: cypher_flag,
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