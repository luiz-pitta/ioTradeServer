'use strict';

const db = require('../models/Connection');

exports.setPushNotification = (email, name_device, id_device, token) => 
	
	new Promise((resolve,reject) => {

		const dt = new Date();
		const dt_mili = dt.getTime();

		const cypher = "OPTIONAL MATCH (p:Profile)-[:LOGGED_DEVICE]->(d:Device {id_device:{id_device}}) "
					+"DETACH DELETE d "
					+"WITH p "
					+"MATCH (n:Profile {email:{email}}) "
					+"MERGE (n)-[r:LOGGED_DEVICE]->(c:Device {id_device:{id_device}, name_device:{name_device}, token:{token}, last_login_date_time:{last_login_date_time}}) "
					+"RETURN c";

		db.cypher({
		    query: cypher,
		    params: {
			    email: email,
			    name_device: name_device,
			    id_device: id_device,
	            token: token,
	            last_login_date_time: dt_mili
			},
		    lean: true
		}, (err, results) =>{
			if (err) 
		    	reject({ status: 500, message: 'Internal Server Error !' });
		    else
		        resolve({ status: 200, message: 'Sucesso!' }); 


		});
		
	});