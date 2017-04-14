'use strict';

const db = require('../models/Connection');

exports.updateReminder = (id_rem,title,day_start,month_start,year_start,minute_start,hour_start, repeat_type, repeat_qty, day_list_start, month_list_start, year_list_start, disconnect) => 
	
	new Promise((resolve,reject) => {

		const id = parseInt(id_rem);
		let ids = [];

		switch (disconnect) {
		    case 0:
		        const cypher = "MATCH (n) WHERE id(n)= {id} "
				+ "SET n.title = {title},"
				+ "n.day_start = {day_start},"
				+ "n.month_start = {month_start},"
				+ "n.year_start = {year_start},"
				+ "n.minute_start = {minute_start},"
				+ "n.hour_start = {hour_start} "
				+ "RETURN n";


				db.cypher({
				    query: cypher,
				    params: {
				        id: id,
					  	title: title,
						day_start: day_start,
						month_start: month_start,
						year_start: year_start,
						minute_start: minute_start,
						hour_start: hour_start
				    },
				    lean: true
				}, (err, results) =>{
					if (err) 
				    	reject({ status: 500, message: 'Internal Server Error !' });
				    else
						resolve({ status: 200, message: 'Reminder atualizada corretamente' }); 
				});

		        break;

		    case 1:

		    	const cypher_repeat = "MATCH (p) WHERE id(p)= {id} "
				+ "MATCH (n) WHERE n.repeat_id_original = p.repeat_id_original AND NOT n.repeat_id_original = -1 "
				+ "SET n.title = {title},"
				+ "n.minute_start = {minute_start},"
				+ "n.hour_start = {hour_start} "
				+ "RETURN p";

				db.cypher({
				    query: cypher_repeat,
					    params: {
					        id: id,
					  		title: title,
							minute_start: minute_start,
							hour_start: hour_start
					    },
					    lean: true
					}, (err, results) =>{
						if (err) 
					    	reject({ status: 500, message: 'Internal Server Error !' });
					    else
							resolve({ status: 200, message: 'Reminders atualizadas corretamente' }); 
				});

		    	break;

		    case 2:

		    	if(repeat_qty == -1){

		    		const cypher = "MATCH (n) WHERE id(n)= {id} "
		    		+ "MATCH (f) WHERE f.repeat_id_original = n.repeat_id_original AND NOT f.repeat_id_original = -1 AND NOT id(f)= {id} "
					+ "SET f.repeat_qty = (f.repeat_qty - 1) "
					+ "RETURN f";

		    		const cypher_repeat = "MATCH (n) WHERE id(n)= {id} "
					+ "SET n.title = {title},"
					+ "n.day_start = {day_start},"
					+ "n.month_start = {month_start},"
					+ "n.year_start = {year_start},"
					+ "n.minute_start = {minute_start},"
					+ "n.hour_start = {hour_start}, "
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
											day_start: day_start,
											month_start: month_start,
											year_start: year_start,
											minute_start: minute_start,
											hour_start: hour_start,
											repeat_id_original:-1,
											repeat_type: 0,
											repeat_qty: repeat_qty
									    },
									    lean: true
									}, (err, results) =>{
										if (err) 
									    	reject({ status: 500, message: 'Internal Server Error !' });
									    else
											resolve({ status: 200, message: 'Reminders atualizadas corretamente' }); 
								});
						    }
					});

		    	}else{

		    		const cypher = "MATCH (p) WHERE id(p)= {id} "
					+ "MATCH (n) WHERE n.repeat_id_original = p.repeat_id_original AND NOT n.repeat_id_original = -1 AND (n.year_start < p.year_start OR "
					+ "(n.year_start = p.year_start  AND (n.month_start < p.month_start OR (n.month_start = p.month_start AND (n.day_start < p.day_start ))))) "
					+ "SET n.repeat_qty = (n.repeat_qty - {repeat_qty}) "
					+ "RETURN n";

					const cypher_get_reminder_repeat = "MATCH (p) WHERE id(p)= {id} "
					+ "MATCH (n) WHERE n.repeat_id_original = p.repeat_id_original AND NOT n.repeat_id_original = -1 AND (n.year_start > p.year_start OR "
					+ "(n.year_start = p.year_start  AND (n.month_start > p.month_start OR (n.month_start = p.month_start AND (n.day_start >= p.day_start ))))) "
					+ "SET n.title = {title},"
					+ "n.day_start = {day_start},"
					+ "n.month_start = {month_start},"
					+ "n.year_start = {year_start},"
					+ "n.minute_start = {minute_start},"
					+ "n.hour_start = {hour_start}, "
					+ "n.repeat_id_original = {repeat_id_original},"
					+ "n.repeat_qty = {repeat_qty} "
					+ "RETURN n";

					const cypher_repeat = "MATCH (n) WHERE id(n)= {id} "
					+ "SET n.day_start = {day_start},"
					+ "n.month_start = {month_start},"
					+ "n.year_start = {year_start} "
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
									    query: cypher_get_reminder_repeat, 
									    params: {
									        id: id,
									  		title: title,
											day_start: day_start,
											month_start: month_start,
											year_start: year_start,
											minute_start: minute_start,
											hour_start: hour_start,
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
															year_start: year_list_start[i]
													    },
													    lean: true
														}, (err, results) =>{
															if (err) 
														    	reject({ status: 500, message: 'Internal Server Error !' });	
													});
												}
												resolve({ status: 200, message: 'Reminders atualizadas corretamente' }); 
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