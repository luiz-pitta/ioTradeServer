'use strict';

const db = require('../models/Connection');

exports.registerReminder = (title,day_start,month_start,year_start,minute_start,hour_start,repeat_type,repeat_qty, creator,
				day_list_start,month_list_start,year_list_start) => 

	new Promise((resolve,reject) => {

		const dt = new Date();
		const dt_mili = dt.getTime();

		const cypher = "MATCH (you:Profile {email:{creator}}) MERGE (reminder:Reminder { "
           + "title:{title}, "
           + "date_time_creation:{date_time_creation}, "
           + "day_start:{day_start}, "
           + "month_start:{month_start}, "

           + "year_start:{year_start}, "
           + "minute_start:{minute_start}, "
           + "hour_start:{hour_start}, "

           + "repeat_type:{repeat_type}, "
           + "repeat_id_original:{repeat_id_original}, "
           + "repeat_qty:{repeat_qty} "

           + " }) MERGE (you) -[:CREATED{creation_date: {creation_date}}]-> (reminder) RETURN reminder";


        if(repeat_type == 0){
        	db.cypher({
			    query: cypher,
			    params: {
			        title: title,
		            date_time_creation: dt_mili,
					day_start: day_start,
					month_start: month_start,
					year_start: year_start,
					minute_start: minute_start,
					hour_start: hour_start,
					repeat_type: repeat_type,
					repeat_id_original:-1,
					repeat_qty: repeat_qty,
					creation_date: dt_mili,
			        creator: creator
			    },
			}, (err, results) =>{
				if(err)
					reject({ status: 500, message: 'Internal Server Error !' });
				else{
					const result = results[0];
					const reminder = result['reminder'];
					let reminderServer = reminder['properties'];
					reminderServer.id = reminder._id;
					resolve({ status: 201, message: 'Reminder Resgistrado com sucesso!', reminderServer:reminderServer });	    		
				}

			});
        }else{

			const id_original = new Date() + title + day_start + month_start + year_start + creator;
			const repeat_qty2 = parseInt(repeat_qty);

			const cypher_repeat = "MATCH (you:Profile {email:{creator}}) "
					+ "FOREACH (r IN range(1,{repeat_qty}) | MERGE (reminder:Reminder { "
					+ "title:{title},"
					+ "date_time_creation:{date_time_creation},"
					
					+ "day_start:{day_start},"
					+ "month_start:{month_start},"
					+ "year_start:{year_start},"

					+ "minute_start:{minute_start},"
					+ "hour_start:{hour_start},"

					+ "repeat_type:{repeat_type},"
					+ "repeat_qty:{repeat_qty},"
					+ "repeat_id_original:{repeat_id_original} + r "

					+ "}) "
					+ "MERGE (you) -[:CREATED{creation_date: {creation_date}}]-> (reminder) ) "
					+ "WITH you "
					+ "MATCH (r:Reminder {repeat_id_original: {complement}}) "
					+ "RETURN r";

			db.cypher({
			    query: cypher_repeat,
			    params: {
			        title: title,
		            date_time_creation: dt_mili,

					day_start: 1,
					month_start: 1,
					year_start: 1,

					minute_start: minute_start,
					hour_start: hour_start,

					repeat_type: repeat_type,
					repeat_qty: repeat_qty2,
					repeat_id_original: id_original,

					creator: creator,
			        creation_date: dt_mili,
			        complement: id_original + 1								
			    },
			}, (err, results) =>{
				if(err)
					reject({ status: 500, message: 'Internal Server Error !' });
				else if (results){

					const result = results[0];
					const reminder = result['r'];
					const id_final = new Date() + reminder._id;
					let reminderServer = reminder['properties'];
					reminderServer.id = reminder._id;

					const cypher_link_id_original = "MATCH (n:Reminder) WHERE n.repeat_id_original= {repeat_id_original} "
					+ "SET n.repeat_id_original = {id_final}, "
					+ "n.day_start = {day_start}, "
					+ "n.month_start = {month_start}, "
					+ "n.year_start = {year_start} "
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
								year_start: year_list_start[j-1]
						    },
						}, (err, results) =>{
							if(err)
								reject({ status: 500, message: 'Internal Server Error !' });

						});
					}

					resolve({ status: 201, message: 'Reminder Resgistrada com sucesso!', reminderServer:reminderServer });		
				}

			});
		}
	});




