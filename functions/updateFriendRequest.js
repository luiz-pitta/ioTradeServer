'use strict';

const db = require('../models/Connection');
const firebase = require('../models/Firebase');

exports.updateFriendRequest = (email, email_friend, status) => 
	
	new Promise((resolve,reject) => {

		const dt = new Date();
		const dt_mili = dt.getTime();

		const cypher = "MATCH (friend:Profile {email: {email_friend}})-[r:ASKED_TO_ADD]->(you:Profile {email: {email}}) "
			+"WITH you, r DELETE r RETURN you";

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
		    else if(results[0]){

		    	if(status == 0)
					resolve({ status: 200, message: 'Relação atualizada corretamente' }); 
				else
				{
					const cypher_know = "MATCH (friend:Profile {email: {email_friend}}), (you:Profile {email: {email}}) "
						+"MERGE (friend)-[:KNOWS{connection_date: {connection_date}, visualization_invitation_accepted : {visualization_invitation_accepted}}]-> (you) RETURN you";

					db.cypher({
				    query: cypher_know,
				    params: {
				        email: email,
				        email_friend: email_friend,
				        visualization_invitation_accepted: false,
				        connection_date: dt_mili
				    },
					}, (err, results) =>{
						if(err)
							reject({ status: 500, message: 'Internal Server Error !' });
						else{

							let registrationTokens = [];
							let user_name, user_photo, n_solicitation;

							const cypher_device = "MATCH (p:Profile {email:{email_friend}})-[:LOGGED_DEVICE]->(d:Device), (you:Profile {email:{email}}) "
											+"OPTIONAL MATCH (n:Profile)<-[r:KNOWS {visualization_invitation_accepted : {visualization_invitation_accepted}}]-(p) "
											+"RETURN d, you.name, you.photo, size(collect(distinct r))";


							db.cypher({
							    query: cypher_device,
							    params: {
								    email_friend: email_friend,
								    email: email,
								    visualization_invitation_accepted: false
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
									  	type: "peopleAccept",
									    name: user_name,
									    photo: user_photo,
									    n_solicitation: n_solicitation.toString()
									  }
									};

									firebase.messaging().sendToDevice(registrationTokens, notification)
									  .then(function(response) {
									  	resolve({ status: 200, message: 'Pedido de amizade aceito com sucesso!' });
									  })
									  .catch(function(error) {
									  	resolve({ status: 203, message: 'Sem Notificação!' }); 
									  });

							    }else
							    	resolve({ status: 203, message: 'Sem Notificação!' }); 

							});
						
						}
					});
				}
		    }
		});

	});