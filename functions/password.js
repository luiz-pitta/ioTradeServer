'use strict';

const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const randomstring = require("randomstring");
const config = require('../config/config.json');
const mg = require('nodemailer-mailgun-transport');
const db = require('../models/Connection');

exports.changePassword = (email, password, newPassword) => 

	new Promise((resolve, reject) => {

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
		    	reject({ status: 404, message: 'User Not Found !' });
		    }
		    else{
		    	const user = result['n'];
		    	const hashed_password = user.hashed_password;

				if (bcrypt.compareSync(password, hashed_password)) {

					const salt = bcrypt.genSaltSync(10);
					const hash = bcrypt.hashSync(newPassword, salt);

					var cypher = "MATCH (n:Profile {email: {email}}) "
					+"SET n.hashed_password = {hash}, n.last_change_password_date_time = {last_change_password_date_time} "
					+"RETURN n";

					db.cypher({
					    query: cypher,
					    params: {
					        email: email,
					        last_change_password_date_time: new Date(),
					        hash: hash
					    },
					    lean: true
					}, (err, results) =>{
						if (err) 
					    	reject({ status: 500, message: 'Internal Server Error !' });
					    else
					    	resolve({ status: 200, message: 'Password Changed Sucessfully !' })
					});

				} else {

					reject({ status: 401, message: 'Invalid Token !' });
				}

			}

		});

	});

exports.resetPasswordInit = email =>

	new Promise((resolve, reject) => {

		const random = randomstring.generate(8);

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
		    	reject({ status: 404, message: 'User Not Found !' });
		    }
		    else{
				const salt = bcrypt.genSaltSync(10);
				const hash = bcrypt.hashSync(random, salt);

				var cypher = "MATCH (n:Profile {email: {email}}) "
					+"SET n.temp_password = {temp_password}, n.temp_password_time = {temp_password_time} "
					+"RETURN n";

				db.cypher({
				    query: cypher,
				    params: {
				        email: email,
				        temp_password: hash,
				        temp_password_time: new Date()
				    },
				    lean: true
				}, (err, results) =>{
					if (err) 
				    	reject({ status: 500, message: 'Internal Server Error !' });
				    else{
				    	var auth = {
						  auth: {
						    api_key: config.api,
						    domain: config.domain
						  }
						};

						var nodemailerMailgun = nodemailer.createTransport(mg(auth));


						const mailOptions = {

			    			from: `"${config.name}" <${config.email}>`,
			    			to: 'luiz.oliveira.pitta@gmail.com', //email 
			    			subject: 'Reset Password Request ', 
			    			html: `Hello ${email},<br><br>
			    			&nbsp;&nbsp;&nbsp;&nbsp; Your reset password token is <b>${random}</b>. 
			    			If you are viewing this mail from a Android Device click this <a href = "http://tymo/${random}">link</a>. 
			    			The token is valid for only 2 minutes.<br><br>
			    			Thanks,<br>
			    			Tymo.`
			    		
						};

						nodemailerMailgun.sendMail(mailOptions, (err, info) =>{
							if (err) {
							  reject({ status: 500, message: 'Internal Server Error !' });
							}
							else {
							  resolve({ status: 200, message: 'Check mail for instructions' })
							}
						});
						
				    }
				});
			}

		});

	});

exports.resetPasswordFinish = (email, token, password) => 

	new Promise((resolve, reject) => {

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
		    	reject({ status: 404, message: 'User Not Found !' });
		    }
		    else{
		    	const user = result['n'];

				const diff = new Date() - new Date(user.temp_password_time); 
				const seconds = Math.floor(diff / 1000);

				if (seconds < 120) {

					if (bcrypt.compareSync(token, user.temp_password)) {

						const salt = bcrypt.genSaltSync(10);
						const hash = bcrypt.hashSync(password, salt);

						var cypher = "MATCH (n:Profile {email: {email}}) "
						+"SET n.temp_password = {temp_password}, n.temp_password_time = {temp_password_time}, n.hashed_password = {hashed_password} "
						+"RETURN n";

						db.cypher({
						    query: cypher,
						    params: {
						        email: email,
						        temp_password: -1,
						        temp_password_time: -1,
						        hashed_password: hash
						    },
						    lean: true
						}, (err, results) =>{
							if (err) 
						    	reject({ status: 500, message: 'Internal Server Error !' });
						    else
						    	resolve({ status: 200, message: 'Password Changed Sucessfully !' })
						});

					} else {

						reject({ status: 401, message: 'Invalid Token !' });
					}

				} else {

					reject({ status: 401, message: 'Time Out ! Try again' });
				}

			}

		});

	});