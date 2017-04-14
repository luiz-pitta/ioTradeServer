'use strict';

const db = require('../models/Connection');

exports.registerActivityGoogle = (activities) => 

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
			+ "id_google:{id_google},"
			+ "repeat_id_original:{repeat_id_original},"
			+ "whatsapp_group_link:{whatsapp_group_link}"
			+ "}) MERGE (a) -[:TAGGED_AS]-> (tag) "
			+ "MERGE (you) -[:INVITED_TO { created : {created}, id_inviter : {id_inviter}, invitation_accepted_visualized : {invitation_accepted_visualized}, "
			+ "permission : {permission}, invitation : {invitation}, visibility : {visibility}, invite_date : {invite_date} "
			+ " }]-> (a) "
			+ "RETURN a";

		activities.forEach( (activity) => {

						        					       
			const creator = activity.creator;

			const title = activity.title;
			const id_google = activity.id_google;
			const description = activity.description;
			const location = activity.location;
			const invitation_type = activity.invitation_type;
			const day_start = activity.day_start;
			const month_start = activity.month_start;
			const year_start = activity.year_start;
			const day_end = activity.day_end;
			const month_end = activity.month_end;
			const year_end = activity.year_end;
			const minute_start = activity.minute_start;
			const hour_start = activity.hour_start;
			const minute_end = activity.minute_end;
			const hour_end = activity.hour_end;
			const repeat_type = activity.repeat_type;
			const repeat_qty = activity.repeat_qty;
			
			const cube_color = activity.cube_color;
			const cube_color_upper = activity.cube_color_upper;
			const cube_icon = activity.cube_icon;
			const whatsapp_group_link = activity.whatsapp_group_link;
			const tags = activity.tags;
			const lat = activity.lat;
			const lng = activity.lng;

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
					id_google: id_google,
					repeat_id_original:-1,
					whatsapp_group_link: whatsapp_group_link,

					tags: tags,

					created: true,
			        visibility: 2,
			        permission: true,
			        invitation: 1, //Confirmado
			        invite_date: dt_mili,
			        id_inviter: creator,
			        creator: creator,
			        invitation_accepted_visualized: true								
			    },
			}, (err, results) =>{
				console.log(results);
				if(err)
					reject({ status: 500, message: 'Internal Server Error !' });
			});

		});

		resolve({ status: 201, message: 'Activity Resgistrada com sucesso!' });

	});

