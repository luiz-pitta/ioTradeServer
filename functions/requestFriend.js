'use strict';

const db = require('../models/Connection');
const firebase = require('../models/Firebase');

exports.sendFriendRequest = (email, email_friend) => 

	new Promise((resolve,reject) => {

		const dt = new Date();
		const dt_mili = dt.getTime();
		
		db.cypher({
		    query: 'MATCH (you:Profile {email:{email}}), (friend:Profile {email:{email_friend}}) WHERE (you)-[:ASKED_TO_ADD]-(friend) OR (you)-[:KNOWS]-(friend) RETURN you',
		    params: {
		        email: email,
		        email_friend: email_friend
		    },
			}, (err, results) =>{
				if(err)
					reject({ status: 500, message: 'Internal Server Error !' });
				else if(!results[0]){
					db.cypher({
					    query: 'MATCH (you:Profile {email:{email}}), (friend:Profile {email:{email_friend}}) MERGE (you)-[:ASKED_TO_ADD {connection_date: {connection_date}, visualization_invitation_accepted: {visualization_invitation_accepted}}]->(friend)  RETURN friend',
					    params: {
					        email: email,
					        email_friend: email_friend,
					        connection_date: dt_mili,
					        visualization_invitation_accepted: false
					    },
						}, (err, results) =>{
							if(err)
								reject({ status: 500, message: 'Internal Server Error !' });
							else{

								let registrationTokens = [];
								let user_name, user_photo, n_solicitation;

								const cypher_device = "MATCH (p:Profile {email:{email_friend}})-[:LOGGED_DEVICE]->(d:Device), (you:Profile {email:{email}}) "
											+"OPTIONAL MATCH (n:Profile)-[r:ASKED_TO_ADD {visualization_invitation_accepted: false}]->(p) "
											+"RETURN d, you.name, you.photo, size(collect(distinct r))";


								db.cypher({
								    query: cypher_device,
								    params: {
									    email_friend: email_friend,
									    email: email
									},
								    lean: true
								}, (err, results) =>{
									if (err) 
								    	reject({ status: 500, message: 'Internal Server Error !' });
								    else if(results.length > 0){
								    	results.forEach( (obj) => {
									    	const device = obj['d'];
									    	user_name = obj['you.name'];
									    	user_photo = obj['you.photo'];
									    	n_solicitation = obj['size(collect(distinct r))'];
								            registrationTokens.push(device.token);
								        });

								        let notification = {
										  data: {
										  	type: "people",
										    name: user_name,
										    photo: user_photo,
										    n_solicitation: n_solicitation.toString()
										  }
										};

										firebase.messaging().sendToDevice(registrationTokens, notification)
										  .then(function(response) {
										  	resolve({ status: 200, message: 'Sucesso!' }); 
										  })
										  .catch(function(error) {
										  	resolve({ status: 203, message: 'Sem Notificação!' }); 
										  });

								    }else
								    	resolve({ status: 203, message: 'Sem Notificação!' }); 


								});
							}
						});
				}else
					resolve({ status: 202, message: 'Já existe um pedido de amizade!' });
			});


	});