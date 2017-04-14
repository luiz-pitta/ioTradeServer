'use strict';

const db = require('../models/Connection');

exports.deletePushNotification = (email, id_device) => 
	
	new Promise((resolve,reject) => {

		const cypher = "MATCH (p:Profile {email:{email}})-[:LOGGED_DEVICE]->(d:Device {id_device:{id_device}}) "
					+"DETACH DELETE d";

		db.cypher({
		    query: cypher,
		    params: {
			    email: email,
			    id_device: id_device
			},
		    lean: true
		}, (err, results) =>{
			if (err) 
		    	reject({ status: 500, message: 'Internal Server Error !' });
		    else
		        resolve({ status: 200, message: 'Sucesso!' }); 


		});
		
	});