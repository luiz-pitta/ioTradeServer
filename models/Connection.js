'use strict';

/**
 * Módulo que cria a conexão com o Banco de Dados Neo4j
 *
 * @author Luiz Guilherme Pitta
 */

const neo4j = require('neo4j');
const url = require('url').parse(process.env.GRAPHENEDB_URL);

const db = new neo4j.GraphDatabase({
		    url: url.protocol + '//' + url.host,
		    auth: {username: url.auth.split(':')[0], password: url.auth.split(':')[1]}
		});

module.exports = db;      