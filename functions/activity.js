'use strict';

const db = require('../models/Connection');

exports.getActivity = (id_act, email) => 
	
	new Promise((resolve,reject) => {

		let people =[];
		let adms =[];
		let tags =[];
		let whats_going_act =[];
		let user;

		const id = parseInt(id_act);

		const cypher_people = "MATCH (a) WHERE id(a)= {id} "
					+"MATCH (n:Profile)-[r:INVITED_TO]->(a) "
					+"WITH a, n, r "
					+"MATCH (p:Profile)-[:INVITED_TO {created: true}]-> (a) "
					+"OPTIONAL MATCH (p2:Profile {email:{email}}) "
					+"OPTIONAL MATCH (p2)-[know:KNOWS]-(n) "
					+"OPTIONAL MATCH (p2)-[fav:HAS_AS_FAVORITE]->(n) "
					+"OPTIONAL MATCH (p2)-[s:ASKED_TO_ADD]-(n) "
					+"OPTIONAL MATCH (p2)<-[z:ASKED_TO_ADD]-(n) "
					+"OPTIONAL MATCH (p2)<-[he:BLOCKED]-(n) "
					+"OPTIONAL MATCH (p2)-[idid:BLOCKED]->(n) "
					+"OPTIONAL MATCH (n)-[:KNOWS]-(n2:Profile)-[fcommon:KNOWS]-(p2) " 
					+"RETURN n, p, r.visibility, r.invitation, size(collect(distinct know)), size(collect(distinct fav)), "
					+"size(collect(distinct s)), size(collect(distinct z)), size(collect(distinct he)), size(collect(distinct idid)), size(collect(distinct fcommon)) ORDER BY n.name";

		const cypher_tag = "MATCH (a) WHERE id(a)= {id} "
					+"MATCH (a)-[:TAGGED_AS]->(t:Tag) "
					+"RETURN t";

		const cypher_adms = "MATCH (a) WHERE id(a)= {id} "
					+"MATCH (n:Profile)-[r:INVITED_TO {permission: true}]->(a) "
					+"OPTIONAL MATCH (p2:Profile {email:{email}}) "
					+"OPTIONAL MATCH (p2)-[know:KNOWS]-(n) "
					+"OPTIONAL MATCH (p2)-[fav:HAS_AS_FAVORITE]->(n) "
					+"OPTIONAL MATCH (p2)-[s:ASKED_TO_ADD]-(n) "
					+"OPTIONAL MATCH (p2)<-[z:ASKED_TO_ADD]-(n) "
					+"OPTIONAL MATCH (p2)<-[he:BLOCKED]-(n) "
					+"OPTIONAL MATCH (p2)-[idid:BLOCKED]->(n) "
					+"OPTIONAL MATCH (n)-[:KNOWS]-(n2:Profile)-[fcommon:KNOWS]-(p2) " 
					+"RETURN n, r.invitation, size(collect(distinct know)), size(collect(distinct fav)), "
					+"size(collect(distinct s)), size(collect(distinct z)), size(collect(distinct he)), size(collect(distinct idid)), size(collect(distinct fcommon)) ORDER BY n.name";

		const cypher_all_repeat = "MATCH (a) WHERE id(a)= {id} "
					+"MATCH (a2:Activity) WHERE a2.repeat_id_original = a.repeat_id_original AND NOT a2.repeat_id_original = -1 "
					+"RETURN a2";

		db.cypher({
		    query: cypher_people,
		    params: {
		        id: id,
		        email:email
		    },
		    lean: true
		}, (err, results) =>{
			console.log(err);
			if (err) 
		    	reject({ status: 500, message: 'Internal Server Error !' });
		    
		    if (!results) {
		        reject({ status: 404, message: 'Usuário sem convidado :(' });
		    } else {
		        results.forEach(function (obj) {
		            let p = obj['n'];
		            const visibility = obj['r.visibility'];
		            const invitation = obj['r.invitation'];
		            const know = obj['size(collect(distinct know))'];
		            const fav = obj['size(collect(distinct fav))'];

		            const s = obj['size(collect(distinct s))'];
		            const z = obj['size(collect(distinct z))'];
		            const he = obj['size(collect(distinct he))'];
		            const idid = obj['size(collect(distinct idid))'];
		            const fcommon = obj['size(collect(distinct fcommon))'];

		            user = obj['p']; 
		            p.privacy = visibility;
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
				    query: cypher_tag,
				    params: {
				        id: id
				    },
				    lean: true
				}, (err, results) =>{
					if (err) 
				    	reject({ status: 500, message: 'Internal Server Error !' });
				    
				    if (!results) {
				        reject({ status: 404, message: 'Usuário sem tag :(' });
				    } else {
				        results.forEach(function (obj) {
				            const t = obj['t'];
				            tags.push(t);
				        });

				        db.cypher({
						    query: cypher_adms,
						    params: {
						        id: id,
						        email:email
						    },
						    lean: true
						}, (err, results) =>{
							console.log(err);
							if (err) 
						    	reject({ status: 500, message: 'Internal Server Error !' });
						    
						    if (!results) {
						        reject({ status: 404, message: 'Usuário sem tag :(' });
						    } else {
						        results.forEach(function (obj) {
						            let p = obj['n'];
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
						            
						            adms.push(p);
						        });

						        db.cypher({
								    query: cypher_all_repeat,
								    params: {
								        id: id
								    },
								    lean: true
								}, (err, results) =>{
									if (err) 
								    	reject({ status: 500, message: 'Internal Server Error !' });
								    
								    if (!results) {
								        reject({ status: 404, message: 'Usuário sem tag :(' });
								    } else {
								        results.forEach(function (obj) {
								            const a = obj['a2'];
								            whats_going_act.push(a);
								        });

								        resolve({ status: 201, people: people, tags: tags, user: user, adms: adms, whats_going_act: whats_going_act });
								    }

								});
						    }

						});
				    }

				});
		    }

		});

	});