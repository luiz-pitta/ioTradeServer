'use strict';

const db = require('../models/Connection');

exports.setAdm = (email, id_act, type) => 
	
	new Promise((resolve,reject) => {

		const id = parseInt(id_act);

		let admOrNot;

		let cypher = "MATCH (a) WHERE id(a)= {id} "
				+"MATCH (p:Profile {email: {email}})-[r:INVITED_TO]->(a) "
				+"SET r.permission = {permission} "
				+"RETURN r";

		if(type == 0)
			admOrNot = false;
		else
			admOrNot = true;


		db.cypher({
		    query: cypher,
		    params: {
		        email: email,
		        id: id,
		        permission: admOrNot
		    },
		    lean: true
		}, (err, results) =>{
			if (err) 
		    	reject({ status: 500, message: 'Internal Server Error !' });
		    else{
		    	resolve({ status: 200, message: 'Relação atualizada corretamente' }); 

		    }
		});

	});