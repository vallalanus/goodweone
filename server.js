const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const axios = require('axios');
const Data = require('./models/Data');
const moment = require('moment-timezone');

const app = express();
const port = process.env.PORT ||  4001;

// Middleware
app.use(bodyParser.json());

// MongoDB connection
const dbURI = 'mongodb+srv://panchadsharamanusha:1234@cluster0.38fjgnz.mongodb.net/goodweRealData';
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Configuration
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

// Utility function to parse numbers and remove units
function parseNumeric(value) {
    const numericValue = parseFloat(value.toString().replace(/[^\d.-]/g, ''));
    return isNaN(numericValue) ? 0 : numericValue;
}

// Function to calculate power factor
function calculatePowerFactor(realPower, voltage, current) {
    const parsedRealPower = parseNumeric(realPower);
    const parsedVoltage = parseNumeric(voltage);
    const parsedCurrent = parseNumeric(current);

    // Check if parsed voltage and current are valid
    if (!parsedVoltage || !parsedCurrent) {
        return 0;  // Return power factor as 0 for invalid data
    }

    const apparentPower = parsedVoltage * parsedCurrent;
    return parsedRealPower / apparentPower;
}
         


// Periodically fetch and store data every 30 seconds
setInterval(async () => {
    try {
        // Step 1: Obtain a token
        const loginResponse = await axios.post(AUTH_URL, LOGIN_PAYLOAD, {
            headers: {
                'Content-Type': 'application/json',
                'Token': JSON.stringify(TOKEN_HEADER)
            }
        });

        if (loginResponse.data.hasError) {
            console.error('Authentication failed');
            return;
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
        
        const dateFromDB = new Date();  
       // Get the current time in SLST (UTC+05:30)
            const localDate = moment(dateFromDB).tz('Asia/Colombo').format('YYYY-MM-DD HH:mm:ss');  // Convert to UTC+05:30
        
        console.log('Local Date:', localDate);

        // Extract specific inverter data
        const inverter = dataResponse.data.data.inverter[0].d;
        const realPower = inverter.output_power;
        const voltage = inverter.grid_voltage;
        const current = inverter.output_current;
        
        // Calculate power factor
        const powerFactor = calculatePowerFactor(realPower, voltage, current);
        
        
        // Extract specific inverter data from the response
        const inverterData = {
            date: localDate,
            powerStationId: inverter.pw_id,
            capacity: inverter.capacity,
            model: inverter.model,
            output_power: parseNumeric(inverter.output_power),
            output_current: parseNumeric(inverter.output_current),
            grid_voltage: parseNumeric(inverter.grid_voltage),
            backup_output: inverter.backup_output,
            soc: inverter.soc,
            soh: inverter.soh,
            last_refresh_time: inverter.last_refresh_time,
            work_mode: inverter.work_mode,
            dc_input1: inverter.dc_input1,
            dc_input2: inverter.dc_input2,
            battery: inverter.battery,
            bms_status: inverter.bms_status,
            warning: inverter.warning,
            charge_current_limit: inverter.charge_current_limit,
            discharge_current_limit: inverter.discharge_current_limit,
            power_factor: powerFactor
        
        };

        // Save data to MongoDB
        const data = new Data(inverterData); 
        await data.save();

        console.log('Data saved to MongoDB:', inverterData);

    } catch (error) {
        console.error('Failed to fetch and save data', error);
    }
}, 30000); // 30 seconds interval

// Test route to check if the backend is running
app.get('/', (req, res) => {
    console.log(' Good we one is running');
    res.send('Backend is running');
});



app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
