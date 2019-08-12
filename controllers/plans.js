// Dependencies
const RosApi = require('node-routeros').RouterOSAPI
const fetch = require('node-fetch');

// Models
const Plans = require('../models/plans')

const conn = new RosApi({
    host: '10.0.8.1',
    user: 'admin',
    password: 'mafafa',
    keepalive: true
})

const plansController = {};

const responseMessage = (res, status, data, error, empty, dolartodayError = null) => {
    if (error) {
        try {
            res.status(status).json({
                status,
                data,
                error,
            })
        } catch (error) {
            console.log(error)
        }
    } else {
        if (empty) {
            res.status(status).json({
                status,
                data,
                empty
            })
        } else {
            if (dolartodayError != null) {
                res.status(status).json({
                    status,
                    data,
                    dolartodayError,
                })
            } else {
                res.status(status).json({
                    status,
                    data,
                })
            }
        }
    }
}

plansController.getProfilesNames = async(req, res, next) => {
    let profiles = []
    conn.connect()
        .then(() => {
            conn.write('/ip/hotspot/user/profile/print')
                .then(data => {
                    for (let i = 0; i < data.length; i++) {
                        profiles.push(data[i].name)
                    }
                    responseMessage(res, 200, profiles)
                })
                .catch(err => {
                    responseMessage(res, 400, 'Mikrotik - Bad Request')
                })
        })
        .catch(err => {
            responseMessage(res, 400, 'Mikrotik - Connection failed')
        })
}

plansController.getPlans = async(req, res, next) => {
    const query = await Plans.find({ disabled: false })
    let cambioDolartoday = 0
    let plans = []

    if (query.length == 0) {
        responseMessage(res, 200, 'No se encuentra ningun plan disponible', false, true)
    } else {

        for (let i = 0; i < query.length; i++) {
            plans.push({
                id: query[i]._id,
                data: query[i].data,
                dataType: query[i].dataType,
                duration: query[i].duration,
                durationType: query[i].durationType,
                cost: query[i].cost,
                dolartoday: 0,
            })
        }

        await fetch('https://s3.amazonaws.com/dolartoday/data.json')
            .then(res => res.json())
            .then(data => {
                cambioDolartoday = data.USD.dolartoday

                for (let i = 0; i < plans.length; i++) {
                    plans[i].dolartoday = plans[i].cost * cambioDolartoday
                }

                responseMessage(res, 200, plans)
            })
            .catch((err) => {
                responseMessage(res, 200, plans, false, false, 'No se ha podido conectar con Dolartoday')
            })
    }

}

plansController.createPlans = async(req, res, next) => {
    const { data, dataType, duration, durationType, cost } = req.body
    const plan = new Plans({
        data,
        dataType,
        duration,
        durationType,
        cost,
        disabled: false,
    })
    await plan.save();
    responseMessage(res, 200, 'Plan agregado satisfactoriamente')
}

plansController.deletePlans = async(req, res, next) => {
    const id = req.params.id
    const query = await Plans.deleteOne({ _id: id });
    responseMessage(res, 200, 'Plan eliminado satisfactoriamente')
}

plansController.updatePlans = async(req, res, next) => {
    const { id, data, dataType, duration, durationType, cost } = req.body
    const query = await Plans.updateOne({ _id: Object(id) }, {
        data,
        dataType,
        duration,
        durationType,
        cost,
        disabled: false,
    })
    responseMessage(res, 200, 'Plan actualizado satisfactoriamente')
}

module.exports = plansController;