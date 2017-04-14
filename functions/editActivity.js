'use strict';

const db = require('../models/Connection');

exports.updateActivity = (id_act,title,description,location,invitation_type,day_start,month_start,year_start,
							day_end,month_end,year_end,minute_start,hour_start,minute_end,hour_end,cube_color, tags, 
							cube_color_upper,cube_icon,lat,lng,whatsapp_group_link, repeat_type, repeat_qty, disconnect,
							day_list_start, month_list_start, year_list_start, day_list_end, month_list_end, year_list_end) => 
	
	new Promise((resolve,reject) => {

		const id = parseInt(id_act);
		let cypher_tag_delete, cypher_tag_update, cypher, cypher_repeat, cypher_get_activity_repeat;

		let ids = [];

		switch (disconnect) {
		    case 0:
		        cypher = "MATCH (n) WHERE id(n)= {id} "
						+ "SET n.title = {title},"

						+ "n.description = {description},"
						+ "n.location = {location},"
						+ "n.lat = {lat},"
						+ "n.lng = {lng},"
						+ "n.invitation_type = {invitation_type},"
						+ "n.whatsapp_group_link = {whatsapp_group_link},"

						+ "n.cube_color = {cube_color},"
						+ "n.cube_color_upper = {cube_color_upper},"
						+ "n.cube_icon = {cube_icon},"

						+ "n.day_start = {day_start},"
						+ "n.month_start = {month_start},"
						+ "n.year_start = {year_start},"
						+ "n.day_end = {day_end},"
						+ "n.month_end = {month_end},"
						+ "n.year_end = {year_end},"

						+ "n.minute_start = {minute_start},"
						+ "n.hour_start = {hour_start}, "
						+ "n.minute_end = {minute_end},"
						+ "n.hour_end = {hour_end} "

						+ "RETURN n";

				cypher_tag_delete = "MATCH (n) WHERE id(n)= {id} "
						+ "MATCH (n)-[rel:TAGGED_AS]->(t:Tag)"	
						+ "DELETE rel";

				cypher_tag_update = "MATCH (n) WHERE id(n)= {id} "
						+ "MATCH (t:Tag) WHERE t.title in {tags} "	
						+ "MERGE (n) -[:TAGGED_AS]-> (t) RETURN n";

				db.cypher({
				    query: cypher,
				    params: {
				        id: id,
				  		title: title,
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
						cube_color: cube_color,
						cube_color_upper: cube_color_upper,
						cube_icon: cube_icon,
						lat: lat,
						lng: lng,
						whatsapp_group_link: whatsapp_group_link
				    },
				    lean: true
				}, (err, results) =>{
					if (err) 
				    	reject({ status: 500, message: 'Internal Server Error !' });
				    else{
						db.cypher({
						    query: cypher_tag_delete,
						    params: {
						        id: id
						    },
						    lean: true
						}, (err, results) =>{
							if (err) 
						    	reject({ status: 500, message: 'Internal Server Error !' });
						    else{
								db.cypher({
								    query: cypher_tag_update,
								    params: {
								        id: id,
								        tags: tags
								    },
								    lean: true
								}, (err, results) =>{
									if (err) 
								    	reject({ status: 500, message: 'Internal Server Error !' });
								    else
										resolve({ status: 200, message: 'Activity atualizada corretamente' }); 
								});
						    }
						});
				    }
				});

		        break;

		    case 1:

		    	cypher_repeat = "MATCH (p) WHERE id(p)= {id} "
				+ "MATCH (n) WHERE n.repeat_id_original = p.repeat_id_original AND NOT n.repeat_id_original = -1 "
				+ "SET n.title = {title},"
				+ "n.description = {description},"
				+ "n.location = {location},"
				+ "n.lat = {lat},"
				+ "n.lng = {lng},"
				+ "n.invitation_type = {invitation_type},"
				+ "n.whatsapp_group_link = {whatsapp_group_link},"

				+ "n.cube_color = {cube_color},"
				+ "n.cube_color_upper = {cube_color_upper},"
				+ "n.cube_icon = {cube_icon},"

				+ "n.minute_start = {minute_start},"
				+ "n.hour_start = {hour_start}, "
				+ "n.minute_end = {minute_end},"
				+ "n.hour_end = {hour_end} "

				+ "RETURN p";

				cypher_tag_delete = "MATCH (p) WHERE id(p)= {id} "
						+ "MATCH (n) WHERE n.repeat_id_original = p.repeat_id_original AND NOT n.repeat_id_original = -1 "
						+ "MATCH (n)-[rel:TAGGED_AS]->(t:Tag)"	
						+ "DELETE rel";

				cypher_tag_update = "MATCH (p) WHERE id(p)= {id} "
						+ "MATCH (n) WHERE n.repeat_id_original = p.repeat_id_original AND NOT n.repeat_id_original = -1 "
						+ "MATCH (t:Tag) WHERE t.title in {tags} "	
						+ "MERGE (n) -[:TAGGED_AS]-> (t) RETURN n";

				db.cypher({
				    query: cypher_repeat,
				    params: {
				        id: id,
				  		title: title,
						description: description,
						location: location,
						invitation_type: invitation_type,
						minute_start: minute_start,
						hour_start: hour_start,
						minute_end: minute_end,
						hour_end: hour_end,
						cube_color: cube_color,
						cube_color_upper: cube_color_upper,
						cube_icon: cube_icon,
						lat: lat,
						lng: lng,
						whatsapp_group_link: whatsapp_group_link
				    },
				    lean: true
				}, (err, results) =>{
					if (err) 
				    	reject({ status: 500, message: 'Internal Server Error !' });
				    else{
						db.cypher({
						    query: cypher_tag_delete,
						    params: {
						        id: id
						    },
						    lean: true
						}, (err, results) =>{
							if (err) 
						    	reject({ status: 500, message: 'Internal Server Error !' });
						    else{
								db.cypher({
								    query: cypher_tag_update,
								    params: {
								        id: id,
								        tags: tags
								    },
								    lean: true
								}, (err, results) =>{
									if (err) 
								    	reject({ status: 500, message: 'Internal Server Error !' });
								    else
										resolve({ status: 200, message: 'Activity atualizada corretamente' }); 
								});
						    }
						});
				    }
				});

		    	break;

		    case 2:

		    	if(repeat_qty == -1){

		    		cypher = "MATCH (n) WHERE id(n)= {id} "
		    		+ "MATCH (f) WHERE f.repeat_id_original = n.repeat_id_original AND NOT f.repeat_id_original = -1 AND NOT id(f)= {id} "
					+ "SET f.repeat_qty = (f.repeat_qty - 1) "
					+ "RETURN f";

		    		cypher_repeat = "MATCH (n) WHERE id(n)= {id} "
					+ "SET n.title = {title},"

					+ "n.description = {description},"
					+ "n.location = {location},"
					+ "n.lat = {lat},"
					+ "n.lng = {lng},"
					+ "n.invitation_type = {invitation_type},"
					+ "n.whatsapp_group_link = {whatsapp_group_link},"

					+ "n.cube_color = {cube_color},"
					+ "n.cube_color_upper = {cube_color_upper},"
					+ "n.cube_icon = {cube_icon},"

					+ "n.day_start = {day_start},"
					+ "n.month_start = {month_start},"
					+ "n.year_start = {year_start},"
					+ "n.day_end = {day_end},"
					+ "n.month_end = {month_end},"
					+ "n.year_end = {year_end},"

					+ "n.minute_start = {minute_start},"
					+ "n.hour_start = {hour_start}, "
					+ "n.minute_end = {minute_end},"
					+ "n.hour_end = {hour_end}, "

					+ "n.repeat_id_original = {repeat_id_original},"
					+ "n.repeat_type = {repeat_type},"
					+ "n.repeat_qty = {repeat_qty} "
					
					+ "RETURN n";

					db.cypher({
					    query: cypher,
						    params: {
						        id: id
						    },
						    lean: true
						}, (err, results) =>{
							if (err) 
						    	reject({ status: 500, message: 'Internal Server Error !' });
						    else{
								db.cypher({
								    query: cypher_repeat,
									    params: {
									        id: id,
									  		title: title,
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
											cube_color: cube_color,
											cube_color_upper: cube_color_upper,
											cube_icon: cube_icon,
											lat: lat,
											lng: lng,
											whatsapp_group_link: whatsapp_group_link,
											repeat_id_original:-1,
											repeat_type: 0,
											repeat_qty: repeat_qty
									    },
									    lean: true
									}, (err, results) =>{
										if (err) 
									    	reject({ status: 500, message: 'Internal Server Error !' });
									    else
											resolve({ status: 200, message: 'Activity atualizadas corretamente' }); 
								});
						    }
					});

		    	}else{

		    		cypher = "MATCH (p) WHERE id(p)= {id} "
					+ "MATCH (n) WHERE n.repeat_id_original = p.repeat_id_original AND NOT n.repeat_id_original = -1 AND (n.year_start < p.year_start OR "
					+ "(n.year_start = p.year_start  AND (n.month_start < p.month_start OR (n.month_start = p.month_start AND (n.day_start < p.day_start ))))) "
					+ "SET n.repeat_qty = (n.repeat_qty - {repeat_qty}) "
					+ "RETURN n";

					cypher_get_activity_repeat = "MATCH (p) WHERE id(p)= {id} "
					+ "MATCH (n) WHERE n.repeat_id_original = p.repeat_id_original AND NOT n.repeat_id_original = -1 AND (n.year_start > p.year_start OR "
					+ "(n.year_start = p.year_start  AND (n.month_start > p.month_start OR (n.month_start = p.month_start AND (n.day_start >= p.day_start ))))) "
					+ "SET n.title = {title},"

					+ "n.description = {description},"
					+ "n.location = {location},"
					+ "n.lat = {lat},"
					+ "n.lng = {lng},"
					+ "n.invitation_type = {invitation_type},"
					+ "n.whatsapp_group_link = {whatsapp_group_link},"

					+ "n.cube_color = {cube_color},"
					+ "n.cube_color_upper = {cube_color_upper},"
					+ "n.cube_icon = {cube_icon},"

					+ "n.day_start = {day_start},"
					+ "n.month_start = {month_start},"
					+ "n.year_start = {year_start},"
					+ "n.day_end = {day_end},"
					+ "n.month_end = {month_end},"
					+ "n.year_end = {year_end},"

					+ "n.minute_start = {minute_start},"
					+ "n.hour_start = {hour_start}, "
					+ "n.minute_end = {minute_end},"
					+ "n.hour_end = {hour_end}, "

					+ "n.repeat_id_original = {repeat_id_original},"
					+ "n.repeat_qty = {repeat_qty} "
					+ "RETURN n";

					cypher_repeat = "MATCH (n) WHERE id(n)= {id} "
					+ "SET n.day_start = {day_start},"
					+ "n.month_start = {month_start},"
					+ "n.year_start = {year_start},"
					+ "n.day_end = {day_end},"
					+ "n.month_end = {month_end},"
					+ "n.year_end = {year_end} "
					+ "RETURN n";

					db.cypher({
					    query: cypher,
						    params: {
						        id: id,
								repeat_qty: repeat_qty
						    },
						    lean: true
						}, (err, results) =>{
							if (err) 
						    	reject({ status: 500, message: 'Internal Server Error !' });
						    else{
						    	const new_id_original = new Date() + id;

						    	db.cypher({
									    query: cypher_get_activity_repeat, 
									    params: {
									        id: id,
									  		title: title,
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
											cube_color: cube_color,
											cube_color_upper: cube_color_upper,
											cube_icon: cube_icon,
											lat: lat,
											lng: lng,
											whatsapp_group_link: whatsapp_group_link,
											repeat_id_original: new_id_original,
											repeat_qty: repeat_qty
									    }
										}, (err, results) =>{
											if (err) 
										    	reject({ status: 500, message: 'Internal Server Error !' });
										    else{

										    	results.forEach( (obj) => {
										            const commit = obj['n'];
										            ids.push(commit._id);
										        });

												let i;
												for(i = 0; i < repeat_qty; i++){
													db.cypher({
													    query: cypher_repeat, 
													    params: {
													        id: ids[i],
													  		title: title,
															day_start: day_list_start[i],
															month_start: month_list_start[i],
															year_start: year_list_start[i],
															day_end: day_list_end[i],
															month_end: month_list_end[i],
															year_end: year_list_end[i]
													    },
													    lean: true
														}, (err, results) =>{
															if (err) 
														    	reject({ status: 500, message: 'Internal Server Error !' });	
													});
												}
												resolve({ status: 200, message: 'Activity atualizadas corretamente' }); 
										    }
									});
					
						    }
					});

		    	}
		    	break;

		    default:
		        reject({ status: 500, message: 'Internal Server Error !' });
		}

	});