'use strict';

const db = require('../models/Connection');

exports.updateFlag = (id_flag,title, repeat_type) => 
	
	new Promise((resolve,reject) => {

		const id = parseInt(id_flag);

		if(repeat_type > 0){

			const cypher_repeat = "MATCH (p) WHERE id(p)= {id} "
				+ "MATCH (n) WHERE n.repeat_id_original = p.repeat_id_original AND NOT n.repeat_id_original = -1 "
				+ "SET n.title = {title} "
				+ "RETURN p";

				db.cypher({
			    query: cypher_repeat,
				    params: {
				        id: id,
				  		title: title
				    },
				    lean: true
				}, (err, results) =>{
					
					if (err) 
				    	reject({ status: 500, message: 'Internal Server Error !' });
				    else
						resolve({ status: 200, message: 'Flags atualizadas corretamente' }); 
				});

		}else{

			const cypher = "MATCH (f) WHERE id(f)= {id} "
				+ "SET f.title = {title} "
				+ "RETURN f";

			db.cypher({
			    query: cypher,
			    params: {
			        id: id,
				  	title: title
			    },
			    lean: true
			}, (err, results) =>{
				if (err) 
			    	reject({ status: 500, message: 'Internal Server Error !' });
			    else
					resolve({ status: 200, message: 'Flag atualizada corretamente' }); 
			});

		}

		

	});