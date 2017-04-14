'use strict';

const db = require('../models/Connection');
const firebase = require('../models/Firebase');

exports.updateInviteRequest = (email, id_act_flag, status, type) => 
	
	new Promise((resolve,reject) => {

		const dt = new Date();
		const dt_mili = dt.getTime();

		let cypher, cypher2; 

		if(type == 0){
			cypher = "MATCH (a) WHERE id(a)= {id_act_flag} "
				+"MATCH (p:Profile {email: {email}})-[r:INVITED_TO]->(a) "
				+"SET r.invitation = {status}, r.invite_date = {invite_date} "
				+"RETURN r";

			cypher2 = "MATCH (you:Profile {email:{email}}) "
					+"MATCH (n) WHERE id(n)= {id_act_flag} "
					+"MERGE (you) -[:INVITED_TO{created : {created}, id_inviter : {id_inviter}, invitation_accepted_visualized : {invitation_accepted_visualized}, permission : {permission}, invitation : {invitation}, visibility : {visibility}, invite_date : {invite_date}}]-> (n) "
					+"RETURN n";
		}else{
			cypher = "MATCH (f) WHERE id(f)= {id_act_flag} "
				+"MATCH (p:Profile {email: {email}})-[r:SIGNALIZED_TO]-> (f) "
				+"SET r.invitation = {status}, r.invite_date = {invite_date} "
				+"RETURN r";

			cypher2 = "MATCH (you:Profile {email:{email}}) "
					+"MATCH (f) WHERE id(f)= {id_act_flag} "
					+"MERGE (you) -[:SIGNALIZED_TO{created : {created},  visualization_invitation_accepted : {visualization_invitation_accepted}, id_inviter : {id_inviter}, invitation : {invitation}, invite_date : {invite_date}}]-> (f) "
					+"RETURN f";
		}



		db.cypher({
		    query: cypher,
		    params: {
		        email: email,
		        id_act_flag: id_act_flag,
		        status: status,
		        invite_date: dt_mili
		    },
		    lean: true
		}, (err, results) =>{
			if (err) 
		    	reject({ status: 500, message: 'Internal Server Error !' });
		    else{
		    	if (results.length == 0 && status == 1) {
		    		if(type == 1){
			    		db.cypher({
						    query: cypher2,
						    params: {
						        email: email,
						        id_act_flag: id_act_flag,
						        invitation: 1,
						        created: false,
						        id_inviter: "",
						        visualization_invitation_accepted: true,
						        invite_date: dt_mili
						    },
						    lean: true
						}, (err, results) =>{
							if (err) 
						    	reject({ status: 500, message: 'Internal Server Error !' });
						    else
								resolve({ status: 200, message: 'Relação atualizada corretamente' }); 
						    
						});
		    		}else{
		    			db.cypher({
						    query: cypher2,
						    params: {
						        email: email,
						        id_act_flag: id_act_flag,
						        invitation: 1,
						        created: false,
						        id_inviter: "",
						        invitation_accepted_visualized: true,
						        permission: false,
						        visibility: 0,
						        invite_date: dt_mili
						    },
						    lean: true
						}, (err, results) =>{
							if (err) 
						    	reject({ status: 500, message: 'Internal Server Error !' });
						    else
								resolve({ status: 200, message: 'Relação atualizada corretamente' }); 
						    
						});
		    		}
		    	}else if(status == 1){

		    		const email_friend = results[0]['r'].id_inviter;

					let registrationTokens = [];
					let title, n_solicitation, name;
					let cypher_device;


					if(type == 0){
						cypher_device = "MATCH (p:Profile {email:{email_friend}})-[:LOGGED_DEVICE]->(d:Device), (you:Profile {email:{email} }) "
									+ "MATCH (n) WHERE id(n)= {id_act_flag} "
									+ "OPTIONAL MATCH (p2:Profile)-[r:INVITED_TO {invitation_accepted_visualized : {invitation_accepted_visualized}, invitation: {invitation}, id_inviter: {email_friend}}]->(n) "
									+ "RETURN d, n.title, size(collect(distinct r)), you.name ";
					}else{
						cypher_device = "MATCH (p:Profile {email:{email_friend}})-[:LOGGED_DEVICE]->(d:Device), (you:Profile {email:{email} }) "
									+ "MATCH (n) WHERE id(n)= {id_act_flag} "
									+ "OPTIONAL MATCH (p2:Profile)-[r:SIGNALIZED_TO {visualization_invitation_accepted : {invitation_accepted_visualized}, invitation: {invitation}, id_inviter: {email_friend}}]->(n) "
									+ "RETURN d, n.title, size(collect(distinct r)), you.name ";
					}


					db.cypher({
					    query: cypher_device,
					    params: {
						    email_friend: email_friend,
						    email: email,
						    id_act_flag: id_act_flag,
						    invitation_accepted_visualized: false,
						    invitation: 1
						},
					    lean: true
					}, (err, results) =>{
						if (err) 
					    	reject({ status: 500, message: 'Internal Server Error !' });
					    else if(results.length > 0){
					    	results.forEach( (obj) => {
						    	const device = obj['d'];
						    	title = obj['n.title'];
						    	name = obj['you.name'];
						    	n_solicitation = obj['size(collect(distinct r))'] + 1;
					            registrationTokens.push(device.token);
					        });

					        let notification = {
							  data: {
							  	type: "inviteAccept",
							    name: name,
							    photo: "",
							    title: title,
							    n_solicitation: n_solicitation.toString()
							  }
							};

							firebase.messaging().sendToDevice(registrationTokens, notification)
							  .then(function(response) {
							  	resolve({ status: 200, message: 'Relação atualizada corretamente' }); 
							  })
							  .catch(function(error) {
							  	resolve({ status: 203, message: 'Sem Notificação!' }); 
							  });

					    }else
					    	resolve({ status: 203, message: 'Sem Notificação!' }); 

					});

		    	}else
		    		resolve({ status: 200, message: 'Relação atualizada corretamente' }); 

		    }
		});

	});