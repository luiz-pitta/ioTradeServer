'use strict';

/**
 * Módulo que faz o roteamento das solicitações para os determinados submodulos correspondentes
 *
 * @author Luiz Guilherme Pitta
 */

/**
 * Variáveis externas (bibliotecas)
 */
const auth = require('basic-auth');
const jwt = require('jsonwebtoken');
const schedule = require('node-schedule');


/**
 * Variáveis da aplicação
 */
const sensor_price = require('./functions/sensor_price');
const get_user = require('./functions/user');
const get_services = require('./functions/services');
const update_user_budget = require('./functions/update_budget_user');
const update_sensor_information = require('./functions/update_sensor_information');
const get_sensor_matchmaking = require('./functions/sensor');

const config = require('./config/config.json');
const db = require('./models/Connection');


let rule_sensor = new schedule.RecurrenceRule();
rule_sensor.second = [0, 6, 12, 18, 24, 30, 36, 42, 48, 54];

const job_sensor = schedule.scheduleJob(rule_sensor, function(){

    let rand_sen = Math.floor((Math.random() * 100000) + 1);

    const cypher = "MATCH (o1:Owner {name:{owner}})  "
            + "MATCH (c1:Category {title:{cat}}) MATCH (g1:Group {title:{group}})  "
            + "FOREACH (r IN range(1,20) | MERGE (s1:Sensor { "
            + "title: {sensor} + r, "
            + "description:{description} }) "
            + "MERGE (o1)-[:OWNS]->(s1) "
            + "MERGE (s1)-[:BELONGS_TO]->(c1) "
            + "MERGE (s1)-[:IS_IN {price:2.5, sum: 5, qty:1}]->(g1) ) ";

    /*db.cypher({
        query: cypher,
        params: {
            owner: "Pitta",
            cat: "Temperatura",
            description: "Mede Temperatura",
            group: "C1",
            sensor: "A" + rand_sen + "_" 
        },
        lean: true
    }, (err, results) =>{
        if (err) 
            console.log('INTERNAL_SERVER_ERROR');
    });*/

});

let rule_connect = new schedule.RecurrenceRule();
//rule_connect.second = [3, 9, 15, 21, 27, 33, 39, 45, 48, 51, 57];
rule_connect.second = [0, 30];

const job_connect = schedule.scheduleJob(rule_connect, function(){

    let rand_con = Math.floor((Math.random() * 100000) + 1);

    const cypher = "MATCH (o1:Owner {name:{owner}}) "
            + "MATCH (g1:Group {title:{group}}) "
            + "MATCH (s1:Sensor) "
            + "FOREACH (r IN range(1,20) | MERGE (c1:Conection { "
            + "title: {title} + r, "
            + "lat:-22.925419, "
            + "lng:-43.259328, "
            + "batery: round(rand()*100 + 1), "
            + "sgnl_net: round(rand()*4 + 1) }) "
            + "MERGE (c1)-[:IS_IN {price:3,sum:5,qty:1}]->(g1)  "
            + "MERGE (c1)-[:IS_NEAR]->(s1)  "
            + "MERGE (o1)-[:OWNS]->(c1) ) ";

    /*db.cypher({
        query: cypher,
        params: {
            owner: "Pitta",
            group: "C1",
            title: "Conectividade " + rand_con + "_" 
        },
        lean: true
    }, (err, results) =>{
        if (err) 
            console.log('INTERNAL_SERVER_ERROR');
        else
            console.log('Foi 123!');
    });*/

});

/*const job_change = schedule.scheduleJob(job_change, function(){

    const cypher = "MATCH (s1:Sensor)-[r:IS_IN]->(g1:Group) "
            + "MATCH (c1:Conection) "
            + "SET c1.batery = round(rand()*100 + 1), "
            + "c1.sgnl_net = round(rand()*4 + 1) ";

    db.cypher({
        query: cypher,
        params: {
            owner: "Pitta",
            group: "C1",
            title: "Conectividade " + rand_con + "_" 
        },
        lean: true
    }, (err, results) =>{
        if (err) 
            console.log('INTERNAL_SERVER_ERROR');
        else
            console.log('Foi 123!');
    });

});*/


module.exports = router => {

    router.get('/', (req, res) => res.end('IoTrade!'));

    /**
     * @return Retorna uma mensagem que tudo ocorreu certo na atualização dos dados.
     */
    router.post('/update_user_budget', (req, res) => {

        const price = req.body.price;

        update_user_budget.updateUserBudget(price)

            .then(result => res.json({ message: result.message }))

            .catch(err => res.status(err.status)
                .json({ message: err.message }));

    });

    /**
     * @return Retorna uma mensagem que tudo ocorreu certo na atualização dos dados.
     */
    router.post('/update_sensor_information', (req, res) => {

        const price = req.body.price;
        const title = req.body.title;
        const category = req.body.category;
        const category_new = req.body.category_new;

        update_sensor_information.updateSensorInformation(title, price, category, category_new)

            .then(result => res.json({ message: result.message }))

            .catch(err => res.status(err.status)
                .json({ message: err.message }));

    });

    /**
     * @return Retorna uma mensagem que tudo ocorreu certo na atualização dos dados.
     */
    router.post('/update_sensor_rating', (req, res) => {

        const sensor = req.body.sensor;
        const connect = req.body.connect;
        const analytics = req.body.analytics;

        update_sensor_information.updateSensorRating(sensor, connect, analytics)

            .then(result => res.json({ message: result.message }))

            .catch(err => res.status(err.status)
                .json({ message: err.message }));

    });

    /**
     * @return Retorna as informações dos sensores.
     */
    router.get('/get_sensor_price_information', (req, res) => {

        sensor_price.getSensorPriceInformation()

            .then(result => res.json({ sensorPriceArray: result.sensorPriceArray }))

            .catch(err => res.status(err.status)
                .json({ message: err.message }));
    });

    /**
     * @return Retorna as informações dos serviços.
     */
    router.post('/get_services_information', (req, res) => {

        const lat = req.body.lat;
        const lng = req.body.lng;

        get_services.getServices(lat, lng)

            .then(result => res.json({ categories: result.categories }))

            .catch(err => res.status(err.status)
                .json({ message: err.message }));
    });

    /**
     * @return Retorna os serviços sem analytics do algoritmo de matchmaking.
     */
    router.post('/get_sensor_matchmaking', (req, res) => {

        const lat = req.body.lat;
        const lng = req.body.lng;

        const category = req.body.service;

        get_sensor_matchmaking.getSensorAlgorithm(lat, lng, category)

            .then(result => res.json({ sensor: result.sensor, connect: result.connect }))

            .catch(err => res.status(err.status)
                .json({ message: err.message }));
    });

    /**
     * @return Retorna os serviços com analytics do algoritmo de matchmaking.
     */
    router.post('/get_sensor_matchmaking_analytics', (req, res) => {

        const lat = req.body.lat;
        const lng = req.body.lng;

        const category = req.body.service;

        get_sensor_matchmaking.getSensorAlgorithmAnalytics(lat, lng, category)

            .then(result => res.json({ sensor: result.sensor, connect: result.connect, analytics: result.analytics }))

            .catch(err => res.status(err.status)
                .json({ message: err.message }));
    });

    /**
     * @return Retorna o usuário do servidor.
     */
    router.get('/get_user', (req, res) => {

        get_user.getProfile()

            .then(result => res.json({ user: result.user }))

            .catch(err => res.status(err.status)
                .json({ message: err.message }));
    });
}
