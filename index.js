'use strict';

/**
 * Módulo que inicia o servidor
 *
 * @author Luiz Guilherme Pitta
 */

const express    = require('express');        
const app        = express();                
const bodyParser = require('body-parser');
const logger 	   = require('morgan');
const router 	   = express.Router();
let server_port = process.env.PORT || 5000; // Se mudar de servidor muda a string da porta

app.use(bodyParser.json());
app.use(logger('dev'));

require('./routes')(router);
app.use('/api/v1', router);

app.listen(server_port); // Se mudar de servidor muda a chamada da função app.listen({server_port, server_ip})

