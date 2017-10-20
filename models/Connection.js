'use strict';

/**
 * Module that creates the connection to the Neo4j Database
 *
 * @author Luiz Guilherme Pitta
 */

const neo4j = require('neo4j');
const config = require('../config/config.json');

const db = new neo4j.GraphDatabase({
		    url: config.url_neo4j,
		    auth: {username: config.user_neo4j, password: config.pass_neo4j}
		});

module.exports = db;        