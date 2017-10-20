'use strict';

/**
 * Module that routes requests to corresponding submodules
 *
 * @author Luiz Guilherme Pitta
 */

/**
 * External variables (libraries)
 */
const auth = require('basic-auth');
const jwt = require('jsonwebtoken');
const schedule = require('node-schedule');


/**
 * Application Variables
 */
const sensor_price = require('./functions/sensor_price');
const get_user = require('./functions/user');
const get_services = require('./functions/services');
const update_user_budget = require('./functions/update_budget_user');
const update_sensor_information = require('./functions/update_sensor_information');
const get_sensor_matchmaking = require('./functions/sensor');
const login = require('./functions/login');
const convert = require('./functions/convert_data');


const config = require('./config/config.json');
const db = require('./models/Connection');


module.exports = router => {

    router.get('/', (req, res) => res.end('IoTrade!'));

    /**
     *  Updates user budget 
     *
     * @return Returns a message that everything went right in updating the data.
     */
    router.post('/update_user_budget', (req, res) => {

        const price = req.body.price;

        update_user_budget.updateUserBudget(price)

            .then(result => res.json({ message: result.message }))

            .catch(err => res.status(err.status)
                .json({ message: err.message }));

    });

     /**
     *  Login User
     *
     * @return Returns a message that everything went right in updating the data.
     */
    router.post('/login_user', (req, res) => {

        const name = req.body.name;

        login.loginMobileHub(name)

            .then(result => res.json({ message: result.message }))

            .catch(err => res.status(err.status)
                .json({ message: err.message }));

    });

    /**
     *  Register when an analytics provider logs in
     *
     * @return Returns a message that everything went right in updating the data.
     */
    router.post('/register_analytics', (req, res) => {

        const name = req.body.name;
        const uuid = req.body.uuid;
        const batery = req.body.batery;
        const signal = req.body.signal;
        const active = req.body.active;
        const device = req.body.device;

        get_user.setAnalyticsMobileHub(name, uuid, batery, signal, active, device)

            .then(result => res.json({ message: result.message }))

            .catch(err => res.status(err.status)
                .json({ message: err.message }));

    });


    /**
     *  Register when a connection provider logs in
     *
     * @return Returns a message that everything went right in updating the data.
     */
    router.post('/register_location', (req, res) => {

        const name = req.body.name;
        const uuid = req.body.uuid;
        const batery = req.body.batery;
        const signal = req.body.signal;
        const lat = req.body.lat;
        const lng = req.body.lng;
        const accuracy = req.body.accuracy;
        const active = req.body.active;
        const device = req.body.device;

        get_user.setLocationMobileHub(name, uuid, batery, signal, lat, lng, accuracy, active, device)

            .then(result => res.json({ message: result.message }))

            .catch(err => res.status(err.status)
                .json({ message: err.message }));

    });

    /**
     *  Updates sensor information
     *
     * @return Returns a message that everything went right in updating the data.
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
     *  Updates sensor rating
     *
     * @return Returns a message that everything went right in updating the data.
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
     *  Get sensor price information
     *
     * @return Returns a message that everything went right in updating the data.
     */
    router.get('/get_sensor_price_information', (req, res) => {

        sensor_price.getSensorPriceInformation()

            .then(result => res.json({ sensorPriceArray: result.sensorPriceArray }))

            .catch(err => res.status(err.status)
                .json({ message: err.message }));
    });

    /**
     *  Get connection provider price information
     *
     * @return Returns a message that everything went right in updating the data.
     */
    router.post('/get_connect_price_information', (req, res) => {

        const device = req.body.device;

        sensor_price.getConnectPriceInformation(device)

            .then(result => res.json({ price: result.price }))

            .catch(err => res.status(err.status)
                .json({ message: err.message }));
    });

    /**
     * @return Returns all the services available to the users
     */
    router.post('/get_services_information', (req, res) => {

        const lat = req.body.lat;
        const lng = req.body.lng;
        const radius = req.body.radius;

        get_services.getServices(lat, lng, radius)

            .then(result => res.json({ categories: result.categories }))

            .catch(err => res.status(err.status)
                .json({ message: err.message }));
    });

    /**
     * @return Returns services without analytics of the matchmaking algorithm.
     */
    router.post('/get_sensor_matchmaking', (req, res) => {

        const lat = req.body.lat;
        const lng = req.body.lng;
        const radius = req.body.radius;

        const category = req.body.service;
        const connection_device = req.body.connectionDevice;

        get_sensor_matchmaking.getSensorAlgorithm(lat, lng, category, radius, connection_device)

            .then(result => res.json({ sensor: result.sensor, connect: result.connect }))

            .catch(err => res.status(err.status)
                .json({ message: err.message }));
    });

    /**
     * @return Returns the services with analytics of the matchmaking algorithm.
     */
    router.post('/get_sensor_matchmaking_analytics', (req, res) => {

        const lat = req.body.lat;
        const lng = req.body.lng;
        const radius = req.body.radius;

        const category = req.body.service;
        const connection_device = req.body.connectionDevice;

        get_sensor_matchmaking.getSensorAlgorithmAnalytics(lat, lng, category, radius, connection_device)

            .then(result => res.json({ sensor: result.sensor, connect: result.connect, analytics: result.analytics }))

            .catch(err => res.status(err.status)
                .json({ message: err.message }));
    });

    /**
     * @return Returns a new analytics provider after disconnection of the old one.
     */
    router.post('/get_new_analytics', (req, res) => {

        const connection_device = req.body.connectionDevice;
        const analytics_device = req.body.analyticsDevice;
        const macAddress = req.body.sensorMacAddress;
        const category = req.body.service;

        get_sensor_matchmaking.getNewAnalytics(category, analytics_device, connection_device, macAddress)

            .then(result => res.json({ analytics: result.analytics }))

            .catch(err => res.status(err.status)
                .json({ message: err.message }));
    });

    /**
     * @return Returns if a sensor is registered in the system
     */
    router.post('/get_sensor_registered', (req, res) => {

        const macAddress = req.body.macAddress;

        get_sensor_matchmaking.getSensorRegistered(macAddress)

            .then(result => res.json({ message: result.message, sensors: result.services }))

            .catch(err => res.status(err.status)
                .json({ message: err.message }));
    });

    /**
     * @return Updates sensor parameters
     */
    router.post('/set_sensor_parameters', (req, res) => {

        const macAddress = req.body.macAddress;
        const device = req.body.name;
        const rssi = req.body.rssi;

        get_sensor_matchmaking.setSensorParameters(macAddress, device, rssi)

            .then(result => res.json({ message: result.message }))

            .catch(err => res.status(err.status)
                .json({ message: err.message }));
    });

    /**
     * @return Removes the relation between a sensor and a connection provider
     */
    router.post('/remove_sensor_mobileHub', (req, res) => {

        const macAddress = req.body.macAddress;
        const device = req.body.name;

        get_sensor_matchmaking.removeSensorMobileHub(macAddress, device)

            .then(result => res.json({ message: result.message }))

            .catch(err => res.status(err.status)
                .json({ message: err.message }));
    });

    /**
     *  Updates the actuator state
     *
     * @return Returns a message that everything went right in updating the data.
     */
    router.post('/set_actuator_state', (req, res) => {

        const macAddress = req.body.macAddress;
        const category = req.body.category;

        get_sensor_matchmaking.setActuatorState(macAddress, category)

            .then(result => res.json({ message: result.message }))

            .catch(err => res.status(err.status)
                .json({ message: err.message }));
    });

    /**
     *  Converts the data from sensor
     *
     * @return Returns the converted data from sensor
     */
    router.post('/convert_sensor_data', (req, res) => {

        const value = req.body.value;
        const calibration = req.body.calibrationData;
        const uuid = req.body.uuidData;
        const name = req.body.name;
        const macAddress = req.body.macAddress;

        convert.getConvertedData(value, calibration, uuid, name, macAddress)

            .then(result => res.json({ message: result.message, sensorName: result.sensorName, uuid: result.uuid, data: result.data, macAddress: result.macAddress }))

            .catch(err => res.status(err.status)
                .json({ message: err.message }));
    });

    /**
     * @return Returns the user 
     */
    router.get('/get_user', (req, res) => {

        get_user.getProfile()

            .then(result => res.json({ user: result.user }))

            .catch(err => res.status(err.status)
                .json({ message: err.message }));
    });
}
