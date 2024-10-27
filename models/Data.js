const mongoose = require('mongoose');

const DataSchema = new mongoose.Schema({
    date : {type : Date, required:true},
    powerStationId: { type: String, required: true }, // Replace 'powerStationId' with your actual field name
    capacity: { type: String, required: true },
    model: { type: String, required: true },
    output_power: { type: String, required: true },
    output_current: { type: String, required: true },
    grid_voltage: { type: String, required: true },
    backup_output: { type: String, required: true },
    soc: { type: String, required: true },
    soh: { type: String, required: true },
    last_refresh_time: { type: String, required: true },
    work_mode: { type: String, required: true },
    dc_input1: { type: String, required: true },
    dc_input2: { type: String, required: true },
    battery: { type: String, required: true },
    bms_status: { type: String},
    warning: { type: String},
    charge_current_limit: { type: String, required: true },
    discharge_current_limit: { type: String, required: true },
    power_factor: { type: Number, required: true },
});

const Data = mongoose.model('Data', DataSchema);

module.exports = Data;
