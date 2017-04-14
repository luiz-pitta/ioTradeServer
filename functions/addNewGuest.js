'use strict';

const db = require('../models/Connection');
const firebase = require('../models/Firebase');

exports.addNewGuest = (creator, v_guest, id_act, type) => 
	
	new Promise((resolve,reject) => {

		const id = parseInt(id_act);
		const dt = new Date();
		const dt_mili = dt.getTime();

		const cypher_guests_act = "MATCH (guest_act:Profile {email:{guest}}) "
					+ "MATCH (n) WHERE id(n)= {id} "
					+ "MERGE (guest_act) -[:INVITED_TO { created : {created}, id_inviter : {id_inviter}, invitation_accepted_visualized : {invitation_accepted_visualized}, "
					+ "permission : {permission}, invitation : {invitation}, visibility : {visibility}, invite_date : {invite_date} "
					+ " }]-> (n) "
					+ "RETURN n";

		const cypher_guest_flag = "MATCH (guest_act:Profile {email:{guest}}) "
					+"MATCH (f) WHERE id(f)= {id} "
					+ "MERGE (guest_act) -[:SIGNALIZED_TO { created : {created},  visualization_invitation_accepted : {visualization_invitation_accepted}, "
				    + "id_inviter : {id_inviter}, invitation : {invitation}, invite_date : {invite_date} }]-> (f) "
					+"RETURN guest_act";

		if(type == 0){

	        v_guest.forEach( (guest) => {

	            db.cypher({
				    query: cypher_guests_act,
				    params: {
				        id: id,
				        guest: guest,
				        visibility: 1, //Somente amigos
				        permission: false,
				        invitation: 0, //Pendente

				        created: false,
				        invite_date: dt_mili,
				        id_inviter: creator,
				        invitation_accepted_visualized: false	
				    },
					}, (err, results) =>{
						if(err)
							reject({ status: 500, message: 'Internal Server Error !' });
					});
	        });	
		}else{
			v_guest.forEach( (guest) => {
	            db.cypher({
				    query: cypher_guest_flag,
				    params: {
				        id: id,
				        guest: guest,
				        id_inviter: creator,
						created: false,
						visualization_invitation_accepted: false,
						invitation: 0,
						invite_date: dt_mili
				    },
					}, (err, results) =>{
						if(err)
							reject({ status: 500, message: 'Internal Server Error !' });
					});
	        });
		}

        let n_solicitation;

		const cypher_device = "MATCH (p:Profile {email:{email}})-[:LOGGED_DEVICE]->(d:Device) "
						+ "OPTIONAL MATCH (p)-[r:SIGNALIZED_TO {visualization_invitation_accepted : {visualization_invitation_accepted}, invitation: {invitation}}]->(f:Flag) "
						+ "OPTIONAL MATCH (p)-[s:INVITED_TO {invitation_accepted_visualized : {invitation_accepted_visualized}, invitation: {invitation}}]->(a:Activity) "
						+ "RETURN d, size(collect(distinct r)), size(collect(distinct s)) ";


		v_guest.forEach(function (guest) {

            db.cypher({
			    query: cypher_device,
			    params: {
				    email: guest,
				    invitation_accepted_visualized: false,
					visualization_invitation_accepted: false,
			    	invitation: 0
				},
			    lean: true
			}, (err, results) =>{
				if (err) 
			    	reject({ status: 500, message: 'Internal Server Error !' });

		    	let registrationTokens = [];

		    	results.forEach( (obj) => {
			    	const device = obj['d'];
			    	n_solicitation = obj['size(collect(distinct r))'] + 1 + obj['size(collect(distinct s))'];
		            registrationTokens.push(device.token);
		        });

		        let notification = {
				  data: {
				  	type: "invite",
				    name: "",
				    photo: "",
				    title: "",
				    n_solicitation: n_solicitation.toString()
				  }
				};

				firebase.messaging().sendToDevice(registrationTokens, notification)
				  .then(function(response) {
				  })
				  .catch(function(error) {
				  });
			    
			});
        });

        resolve({ status: 201, message: 'Convidados com sucesso!'});

	});