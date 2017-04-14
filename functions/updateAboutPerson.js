'use strict';

const db = require('../models/Connection');

exports.updateAboutPerson = (name,email,photo,lives_in,url,works_at,studied_at, description, facebook_messenger_enable, modify_facebook_name, modify_facebook_photo) => 
	
	new Promise((resolve,reject) => {

		const cypher = "MATCH (n:Profile {email: {email}}) "
				+ "SET n.name = {name},"
				+ "n.photo = {photo},"
				+ "n.lives_in = {lives_in},"
				+ "n.description = {description},"
				+ "n.url = {url},"
				+ "n.works_at = {works_at},"
				+ "n.facebook_messenger_enable = {facebook_messenger_enable},"
				+ "n.modify_facebook_name = {modify_facebook_name},"
				+ "n.modify_facebook_photo = {modify_facebook_photo},"
				+ "n.studied_at = {studied_at} "
				+ "RETURN n";

		db.cypher({
		    query: cypher,
		    params: {
		        name: name,
			  	email: email,
				photo: photo,
				lives_in: lives_in,
				description: description,
				url: url,
				works_at: works_at,

				facebook_messenger_enable: facebook_messenger_enable,
				modify_facebook_name: modify_facebook_name,
				modify_facebook_photo: modify_facebook_photo,

				studied_at: studied_at
		    },
		    lean: true
		}, (err, results) =>{
			if (err) 
		    	reject({ status: 500, message: 'Internal Server Error !' });
		    else
				resolve({ status: 200, message: 'Relação atualizada corretamente' }); 
		});

	});