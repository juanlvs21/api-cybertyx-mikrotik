// Dependencies
const fetch = require('node-fetch');

// Models
const Plans = require('../models/plans')

const plansController = {};

const responseMessage = (res, status, data, error, empty) => {
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
            res.status(status).json({
                status,
                data,
            })
        }
    }
}

plansController.getPlans = async(req, res, next) => {
    const query = await Plans.find({ disabled: false })
    let cambioDolartoday = 0
    let plans = []

    if (query.length == 0) {
        responseMessage(res, 200, 'No se encuentra ningun plan disponible', false, true)
    } else {
        await fetch('https://s3.amazonaws.com/dolartoday/data.json')
            .then(res => res.json())
            .then(data => {
                cambioDolartoday = data.USD.dolartoday

                for (let i = 0; i < query.length; i++) {
                    plans.push({
                        id: query[i]._id,
                        data: query[i].data,
                        duration: query[i].duration,
                        cost: query[i].cost,
                        dolartoday: query[i].cost * cambioDolartoday,
                    })
                }

                responseMessage(res, 200, plans)
            })
            .catch((err) => {
                responseMessage(res, 200, 'No se ha podido conectar con Dolartoday', true)
            })
    }

}

plansController.createPlans = async(req, res, next) => {
    const plan = new Plans({
        data: req.body.data,
        duration: req.body.duration,
        cost: req.body.cost,
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

module.exports = plansController;