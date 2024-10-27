const express = require('express');
const axios = require('axios');
const Data = require('../models/Data');

const router = express.Router();

const AUTH_URL = 'https://www.semsportal.com/api/v1/Common/CrossLogin';
const API_URL = 'https://www.semsportal.com/api/v1/PowerStation/GetMonitorDetailByPowerstationId';

const LOGIN_PAYLOAD = {
    account: 'iromi1986@gmail.com',
    pwd: 'gw123456'
};

const TOKEN_HEADER = {
    version: 'v2.1.0',
    client: 'ios',
    language: 'en'
};

// Fetch data and store in MongoDB
router.post('/fetch', async (req, res) => {
    try {
        // Step 1: Obtain a token
        const loginResponse = await axios.post(AUTH_URL, LOGIN_PAYLOAD, {
            headers: {
                'Content-Type': 'application/json',
                'Token': JSON.stringify(TOKEN_HEADER)
            }
        });

        if (loginResponse.data.hasError) {
            return res.status(401).json({ error: 'Authentication failed' });
        }

        const { uid, timestamp, token, client, version, language } = loginResponse.data.data;
        const powerStationId = '90402d4e-a252-45b3-a6b5-83436f05e2d3';  // Replace with your powerStationId

        // Step 2: Fetch inverter data
        const dataResponse = await axios.post(`${API_URL}`, {
            powerStationId
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Token': JSON.stringify({ version, client, language, timestamp, uid, token })
            }
        });


       /* The line `console.log("Inverter Data:: ",dataResponse.data.data.inverter[0].d)` is logging
       the specific data related to the first inverter received in the response from the API call.
       It is accessing the nested structure of the response object to extract and display the data
       related to the first inverter in the array of inverters. */
        // console.log("Inverter Data:: ",dataResponse.data.data.inverter[0].d)


        // console.log("Inverter Data location 1:: ",dataResponse.data.data.inverter[0].d)
        


                // Extract specific inverter data from the response
            const inverterData = {
                powerStationId:dataResponse.data.data.inverter[0].d.pw_id,
                capacity: dataResponse.data.data.inverter[0].d.capacity,
                model: dataResponse.data.data.inverter[0].d.model,
                output_power: dataResponse.data.data.inverter[0].d.output_power,
                output_current: dataResponse.data.data.inverter[0].d.output_current,
                grid_voltage: dataResponse.data.data.inverter[0].d.grid_voltage,
                backup_output: dataResponse.data.data.inverter[0].d.backup_output,
                soc: dataResponse.data.data.inverter[0].d.soc,
                soh: dataResponse.data.data.inverter[0].d.soh,
                last_refresh_time: dataResponse.data.data.inverter[0].d.last_refresh_time,
                work_mode: dataResponse.data.data.inverter[0].d.work_mode,
                dc_input1: dataResponse.data.data.inverter[0].d.dc_input1,
                dc_input2: dataResponse.data.data.inverter[0].d.dc_input2,
                battery: dataResponse.data.data.inverter[0].d.battery,
                bms_status:dataResponse.data.data.inverter[0].d.bms_status,
                warning: dataResponse.data.data.inverter[0].warning,
                charge_current_limit: dataResponse.data.data.inverter[0].d.charge_current_limit,
                discharge_current_limit: dataResponse.data.data.inverter[0].d.discharge_current_limit,
            };

            console.log("Inverter Data",inverterData)
            // Save extracted data to MongoDB
            const data = new Data(inverterData); 
                await data.save();

        res.status(200).json({ message: 'Data saved to mongodb successfully', data: dataResponse.data.data.inverter[0].d });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch and save data' });
    }
});

module.exports = router;
