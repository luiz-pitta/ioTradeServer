'use strict';

const db = require('../models/Connection');

exports.getFlagReminder = (id_flag_reminder, email) => 
	
	new Promise((resolve,reject) => {

		let people =[];
		let whats_going_flag =[];
		let my_commit_reminder =[];
		let creator;
		const id = parseInt(id_flag_reminder);

		const cypher = "MATCH (f) WHERE id(f)= {id} "
					+"MATCH (n:Profile)-[r:SIGNALIZED_TO]->(f) "
					+"WITH f, n, r "
					+"MATCH (p:Profile)-[:SIGNALIZED_TO {created : true}]-> (f) "
					+"OPTIONAL MATCH (p2:Profile {email:{email}}) "
					+"OPTIONAL MATCH (p2)-[know:KNOWS]-(n) "
					+"OPTIONAL MATCH (p2)-[fav:HAS_AS_FAVORITE]->(n) "
					+"OPTIONAL MATCH (p2)-[s:ASKED_TO_ADD]-(n) "
					+"OPTIONAL MATCH (p2)<-[z:ASKED_TO_ADD]-(n) "
					+"OPTIONAL MATCH (p2)<-[he:BLOCKED]-(n) "
					+"OPTIONAL MATCH (p2)-[idid:BLOCKED]->(n) "
					+"OPTIONAL MATCH (n)-[:KNOWS]-(n2:Profile)-[fcommon:KNOWS]-(p2) " 
					+"RETURN n, p, r.invitation, size(collect(distinct know)), size(collect(distinct fav)), "
					+"size(collect(distinct s)), size(collect(distinct z)), size(collect(distinct he)), size(collect(distinct idid)), size(collect(distinct fcommon)) ORDER BY n.name";

		const cypher_all_repeat_flag = "MATCH (f) WHERE id(f)= {id} "
					+"MATCH (f2:Flag) WHERE f2.repeat_id_original = f.repeat_id_original AND NOT f2.repeat_id_original = -1 "
					+"RETURN f2";

		const cypher_all_repeat_reminder = "MATCH (f) WHERE id(f)= {id} "
					+"MATCH (f2:Reminder) WHERE f2.repeat_id_original = f.repeat_id_original AND NOT f2.repeat_id_original = -1 "
					+"RETURN f2";

		db.cypher({
		    query: cypher,
		    params: {
		        id: id,
		        email:email
		    },
		    lean: true
		}, (err, results) =>{
			if (err) 
		    	reject({ status: 500, message: 'Internal Server Error !' });
		    
	        results.forEach(function (obj) {
	            let p = obj['n'];
	            creator = obj['p'];
	            const invitation = obj['r.invitation'];
	            const know = obj['size(collect(distinct know))'];
	            const fav = obj['size(collect(distinct fav))'];

	            const s = obj['size(collect(distinct s))'];
	            const z = obj['size(collect(distinct z))'];
	            const he = obj['size(collect(distinct he))'];
	            const idid = obj['size(collect(distinct idid))'];
	            const fcommon = obj['size(collect(distinct fcommon))'];

	            p.invitation = invitation;
	            p.count_knows = know;
	            p.count_favorite = fav;

	            p.count_ask_add = s;
	            p.qty_successfully_logins = z;
	            p.he_blocked = he;
	            p.i_blocked = idid;
	            p.count_common = fcommon;

	            people.push(p);
	        });

	        db.cypher({
			    query: cypher_all_repeat_flag,
			    params: {
			        id: id
			    },
			    lean: true
			}, (err, results) =>{
				if (err) 
			    	reject({ status: 500, message: 'Internal Server Error !' });
			    
			    if (!results) {
			        resolve({ status: 202, people: people });
			    } else {
			        results.forEach(function (obj) {
			            const f = obj['f2'];
			            whats_going_flag.push(f);
			        });

			        db.cypher({
					    query: cypher_all_repeat_reminder,
					    params: {
					        id: id
					    },
					    lean: true
					}, (err, results) =>{
						if (err) 
					    	reject({ status: 500, message: 'Internal Server Error !' });
					    
				        results.forEach(function (obj) {
				            const r = obj['f2'];
				            my_commit_reminder.push(r);
				        });
				        
				        resolve({ status: 201, people: people, user: creator, whats_going_flag:whats_going_flag, my_commit_reminder:my_commit_reminder });

					});
			    }

			});

		});

	});