'use strict';

const db = require('../models/Connection');
const bcrypt = require('bcryptjs');

exports.registerUser = (name,email,password,day_born,month_born,year_born,gender,photo,
				lives_in,privacy,url,works_at,studied_at,facebook_messenger_link, description, 
				interest, from_facebook,location_gps,notifications,facebook_messenger_enable, id_facebook) => 

	new Promise((resolve,reject) => {

	    const salt = bcrypt.genSaltSync(10);
		const hash = bcrypt.hashSync(password, salt);
		const dt = new Date();
		const dt_mili = dt.getTime();

		var cypher = "MERGE (profile:Profile { "
			+ "name: {name},"
			+ "email: {email},"
			+ "hashed_password: {hashed_password},"
			+ "date_time_account_creation: {date_time_account_creation},"
			+ "day_born: {day_born},"
			+ "month_born: {month_born},"
			+ "year_born: {year_born},"
			+ "gender: {gender},"
			+ "photo: {photo},"
			+ "lives_in: {lives_in},"
			+ "last_login_date_time: {last_login_date_time},"
			+ "last_change_password_date_time: {last_change_password_date_time},"
			+ "qty_successfully_logins: {qty_successfully_logins},"
			+ "qty_unsuccessfully_logins: {qty_unsuccessfully_logins},"
			+ "description: {description},"
			+ "url: {url},"
			+ "works_at: {works_at},"
			+ "studied_at: {studied_at},"
			+ "temp_password: {temp_password},"
			+ "temp_password_time: {temp_password_time},"
			+ "facebook_messenger_link: {facebook_messenger_link},"
			+ "from_facebook: {from_facebook},"
			+ "modify_facebook_name: {modify_facebook_name},"
			+ "modify_facebook_photo: {modify_facebook_photo},"
			+ "location_gps: {location_gps},"
			+ "notifications: {notifications},"
			+ "facebook_messenger_enable: {facebook_messenger_enable},"
			+ "id_facebook: {id_facebook},"
			+ "privacy: {privacy}"
			+ "}) RETURN profile";

		db.cypher({
		    query: 'MATCH (n:Profile {email: {email}}) RETURN n',
		    params: {
			    email: email
			},
		    lean: true
		}, (err, results) =>{
			if (err) {
		    	reject({ status: 500, message: 'Internal Server Error !' });
		    }

			var result  = results[0];
		    if(!result){
		    	db.cypher({
				    query: cypher,
				    params: {
				        name: name,
					  	email: email,
						hashed_password	: hash,
						date_time_account_creation: dt_mili,
						day_born: day_born,
						month_born: month_born,
						year_born: year_born,
						gender: gender,
						photo: photo,
						lives_in: lives_in,
						last_login_date_time: dt_mili,
						last_change_password_date_time: dt_mili,
						qty_successfully_logins: 0,
						qty_unsuccessfully_logins: 0,
						description: description,
						url: url,
						works_at: works_at,
						studied_at: studied_at,
						facebook_messenger_link: facebook_messenger_link,
						privacy: privacy,
						id_facebook: id_facebook,
						modify_facebook_name: false,
						modify_facebook_photo: false,
						location_gps: true,
						notifications: true,
						facebook_messenger_enable: false,
						temp_password: -1,
						temp_password_time: -1,
						from_facebook: from_facebook
				    }
				}, (err, user) =>{
					if(err)
						reject({ status: 500, message: 'Internal Server Error !' });
					else if(user){

						var result = user[0];
						var prof = result['profile'];

						interest.forEach( (title) => {
				            db.cypher({
							    query: 'MATCH (interest:Interest {title:{title}}) MATCH (n) WHERE id(n)= {id} MERGE (n) -[:INTERESTED_IN]-> (interest) RETURN n',
							    params: {
							        id: prof._id,
							        title: title
							    },
								}, (err, results) =>{
									if(err)
										reject({ status: 500, message: 'Internal Server Error !' });
								});
				        });	
						resolve({ status: 201, message: 'User Registered Sucessfully !' });
					}

				});
		    }
		    else{
		    	
		    	reject({ status: 404, message: 'User Already Registered !' });
			}

		});


		

	});


