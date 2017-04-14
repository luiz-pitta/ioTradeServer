'use strict';

const db = require('../models/Connection');
const firebase = require('../models/Firebase');

exports.registerActivity = (creator,v_guest, v_adms, title,description,location,invitation_type,day_start,
				month_start,year_start,day_end,month_end,year_end,minute_start,hour_start,minute_end,hour_end,repeat_type,
				repeat_qty,cube_color,cube_color_upper, cube_icon,whatsapp_group_link, tags, visibility, lat, lng,
				day_list_start,month_list_start,year_list_start,day_list_end,month_list_end,year_list_end) => 

	new Promise((resolve,reject) => {

		const dt = new Date();
		const dt_mili = dt.getTime();


        const cypher = "MATCH (tag:Tag) WHERE tag.title in {tags} "
        + "MATCH (you:Profile {email:{creator}}) "
        + "MERGE (a:Activity { "
			+ "title:{title},"
			+ "date_time_creation:{date_time_creation},"
			+ "description:{description},"
			+ "location:{location},"
			+ "invitation_type:{invitation_type},"
			+ "day_start:{day_start},"
			+ "month_start:{month_start},"
			+ "year_start:{year_start},"
			+ "day_end:{day_end},"
			+ "month_end:{month_end},"
			+ "year_end:{year_end},"
			+ "minute_start:{minute_start},"
			+ "hour_start:{hour_start},"
			+ "minute_end:{minute_end},"
			+ "hour_end:{hour_end},"
			+ "repeat_type:{repeat_type},"
			+ "repeat_qty:{repeat_qty},"
			+ "cube_color:{cube_color},"
			+ "cube_color_upper:{cube_color_upper},"
			+ "cube_icon:{cube_icon},"
			+ "lat:{lat}," 
			+ "lng:{lng},"
			+ "repeat_id_original:{repeat_id_original},"
			+ "whatsapp_group_link:{whatsapp_group_link}"
			+ "}) MERGE (a) -[:TAGGED_AS]-> (tag) "
			+ "MERGE (you) -[:INVITED_TO { created : {created}, id_inviter : {id_inviter}, invitation_accepted_visualized : {invitation_accepted_visualized}, "
			+ "permission : {permission}, invitation : {invitation}, visibility : {visibility}, invite_date : {invite_date} "
			+ " }]-> (a) "
			+ "RETURN a";

		if(repeat_type == 0){
			db.cypher({
			    query: cypher,
			    params: {
			        title: title,
		            date_time_creation: dt_mili,
					description: description,
					location: location,
					invitation_type: invitation_type,
					day_start: day_start,
					month_start: month_start,
					year_start: year_start,
					day_end: day_end,
					month_end: month_end,
					year_end: year_end,
					minute_start: minute_start,
					hour_start: hour_start,
					minute_end: minute_end,
					hour_end: hour_end,
					repeat_type: repeat_type,
					repeat_qty: repeat_qty,
					cube_color: cube_color,
					cube_color_upper: cube_color_upper,
					cube_icon: cube_icon,
					lat: lat,
					lng: lng,
					repeat_id_original:-1,
					whatsapp_group_link: whatsapp_group_link,

					tags: tags,

					created: true,
			        visibility: visibility,
			        permission: true,
			        invitation: 1, //Confirmado
			        invite_date: dt_mili,
			        id_inviter: creator,
			        creator: creator,
			        invitation_accepted_visualized: true								
			    },
			}, (err, results) =>{
				if(err)
					reject({ status: 500, message: 'Internal Server Error !' });
				else if (results){

					const result = results[0];
					const activity = result['a'];
					let activityServer = activity['properties'];
					activityServer.id = activity._id;

			        const cypher_guests = "MATCH (guest_act:Profile {email:{guest}}) "
								+ "MATCH (n) WHERE id(n)= {id} "
								+ "MERGE (guest_act) -[:INVITED_TO { created : {created}, id_inviter : {id_inviter}, invitation_accepted_visualized : {invitation_accepted_visualized}, "
								+ "permission : {permission}, invitation : {invitation}, visibility : {visibility}, invite_date : {invite_date} "
								+ " }]-> (n) "
								+ "RETURN n";

			        v_guest.forEach( (guest) => {

			        	let adm_status = false;

			        	v_adms.forEach( (adm) => {
			        		if(guest == adm){
			        			adm_status = true;
			        		}

			        	});
			            db.cypher({
						    query: cypher_guests,
						    params: {
						        id: activity._id,
						        guest: guest,
						        visibility: visibility,
						        permission: adm_status,
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
						    else if(results.length > 0){
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
						    }
						});
			        });

			        resolve({ status: 201, message: 'Activity Resgistrada com sucesso!', activityServer: activityServer});
				}

			});
		}else{

			const id_original = new Date() + title + cube_icon + day_start + month_start + year_start + creator;
			const repeat_qty2 = parseInt(repeat_qty);

			const cypher_repeat = "MATCH (tag:Tag) WHERE tag.title in {tags} "
			+ "MATCH (you:Profile {email:{creator}}) "
			+ "FOREACH (r IN range(1,{repeat_qty}) | MERGE (a:Activity { "
			+ "title:{title},"
			+ "date_time_creation:{date_time_creation},"
			+ "description:{description},"
			+ "location:{location},"
			+ "invitation_type:{invitation_type},"
			+ "day_start:{day_start},"
			+ "month_start:{month_start},"
			+ "year_start:{year_start},"
			+ "day_end:{day_end},"
			+ "month_end:{month_end},"
			+ "year_end:{year_end},"
			+ "minute_start:{minute_start},"
			+ "hour_start:{hour_start},"
			+ "minute_end:{minute_end},"
			+ "hour_end:{hour_end},"
			+ "repeat_type:{repeat_type},"
			+ "repeat_qty:{repeat_qty},"
			+ "cube_color:{cube_color},"
			+ "cube_color_upper:{cube_color_upper},"
			+ "cube_icon:{cube_icon},"
			+ "lat:{lat}," 
			+ "lng:{lng},"
			+ "repeat_id_original:{repeat_id_original} + r,"
			+ "whatsapp_group_link:{whatsapp_group_link}"
			+ "}) MERGE (a) -[:TAGGED_AS]-> (tag) "
			+ "MERGE (you) -[:INVITED_TO { created : {created}, id_inviter : {id_inviter}, invitation_accepted_visualized : {invitation_accepted_visualized}, "
			+ "permission : {permission}, invitation : {invitation}, visibility : {visibility}, invite_date : {invite_date} "
			+ " }]-> (a) ) "
			+ "WITH you "
			+ "MATCH (a:Activity {repeat_id_original: {complement}}) "
			+ "RETURN a";

			db.cypher({
			    query: cypher_repeat,
			    params: {
			        title: title,
		            date_time_creation: dt_mili,
					description: description,
					location: location,
					invitation_type: invitation_type,
					day_start: 1,
					month_start: 1,
					year_start: 1,
					day_end: 1,
					month_end: 1,
					year_end: 1,
					minute_start: minute_start,
					hour_start: hour_start,
					minute_end: minute_end,
					hour_end: hour_end,
					repeat_type: repeat_type,
					repeat_qty: repeat_qty2,
					cube_color: cube_color,
					cube_color_upper: cube_color_upper,
					cube_icon: cube_icon,
					lat: lat,
					lng: lng,
					repeat_id_original: id_original,
					whatsapp_group_link: whatsapp_group_link,
					creator: creator,
					tags: tags,

			        complement: id_original + 1,	

			        created: true,
			        visibility: visibility,
			        permission: true,
			        invitation: 1, //Confirmado
			        invite_date: dt_mili,
			        id_inviter: creator,
			        creator: creator,
			        invitation_accepted_visualized: true							
			    },
			}, (err, results) =>{
				if(err)
					reject({ status: 500, message: 'Internal Server Error !' });
				else if (results){

					const result = results[0];
					const activity = result['a'];
					const id_final = new Date() + activity._id;
					let activityServer = activity['properties'];
					activityServer.id = activity._id;

					const cypher_link_id_original = "MATCH (n:Activity) WHERE n.repeat_id_original= {repeat_id_original} "
					+ "SET n.repeat_id_original = {id_final}, "
					+ "n.day_start = {day_start}, "
					+ "n.month_start = {month_start}, "
					+ "n.year_start = {year_start}, "
					+ "n.day_end = {day_end}, "
					+ "n.month_end = {month_end}, "
					+ "n.year_end = {year_end} "
					+ "RETURN n";

					let j;

					for(j = 1; j <= repeat_qty; j++){
						db.cypher({
						    query: cypher_link_id_original,
						    params: {
						        repeat_id_original: id_original + j,
						        id_final: id_final,
						        day_start: day_list_start[j-1],
								month_start: month_list_start[j-1],
								year_start: year_list_start[j-1],
								day_end: day_list_end[j-1],
								month_end: month_list_end[j-1],
								year_end: year_list_end[j-1]
						    },
						}, (err, results) =>{
							if(err)
								reject({ status: 500, message: 'Internal Server Error !' });
							else{

								const result = results[0];
								const activity = result['n'];

								const cypher_guests = "MATCH (guest_act:Profile {email:{guest}}) "
								+ "MATCH (n) WHERE id(n)= {id} "
								+ "MERGE (guest_act) -[:INVITED_TO { created : {created}, id_inviter : {id_inviter}, invitation_accepted_visualized : {invitation_accepted_visualized}, "
								+ "permission : {permission}, invitation : {invitation}, visibility : {visibility}, invite_date : {invite_date} "
								+ " }]-> (n) "
								+ "RETURN n";

								v_guest.forEach( (guest) => {

						        	let adm_status = false;

						        	v_adms.forEach( (adm) => {
						        		if(guest == adm)
						        			adm_status = true;
						        	});

						            db.cypher({
									    query: cypher_guests,
									    params: {
									        id: activity._id,
									        guest: guest,
									        visibility: visibility,
									        permission: adm_status,
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
							}
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
						    else if(results.length > 0){
						    	let registrationTokens = [];

						    	results.forEach( (obj) => {
							    	const device = obj['d'];
							    	n_solicitation = obj['size(collect(distinct r))'] + repeat_qty + obj['size(collect(distinct s))'];
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
						    }
						});
			        });

					resolve({ status: 201, message: 'Activity Resgistrada com sucesso!', activityServer:activityServer });	
				}

			});
		}

	});

