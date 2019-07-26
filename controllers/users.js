const User = require('../models/user');
const userController = {};
const CryptoJS = require("crypto-js");

const RosApi = require('node-routeros').RouterOSAPI;

const conn = new RosApi({
    host: '10.0.8.1',
    user: 'admin',
    password: 'mafafa',
    keepalive: true
});

const secretCryptoKey = 'tyx1q2w3e4r()'

const responseMessage = (res, status, data, error) => {
    if (error) {
        res.status(status).json({
            status,
            data,
            error,
        })
    } else {
        res.status(status).json({
            status,
            data,
        })
    }
}

userController.mikrotikCreateUsers = (req, res, next) => {
    conn.connect()
        .then(() => {
            conn.write('/ip/hotspot/user/print')
                .then((data) => {
                    let user
                    for (let i = 1; i < data.length; i++) {
                        user = new User({
                            id: data[i]['.id'],
                            user: data[i].name,
                            name: null,
                            password: CryptoJS.HmacSHA1(data[i].password, secretCryptoKey),
                            profile: data[i].profile,
                            uptime: data[i].uptime,
                            bytesIn: data[i]['bytes-in'],
                            bytesOut: data[i]['bytes-out'],
                            packetsIn: data[i]['packets-in'],
                            packetsOut: data[i]['packets-out'],
                            dynamic: data[i].dynamic,
                            disabled: data[i].disabled,
                        });
                        user.save()
                    }

                    responseMessage(res, 200, 'Successfully created users')
                })
                .catch(err => {
                    responseMessage(res, 400, 'Mikrotik - Bad Request')
                });
        })
        .catch(err => {
            responseMessage(res, 400, 'Mikrotik - Connection failed')
        });
}

userController.getUsers = async(req, res, next) => {
    const users = await User.find();
    responseMessage(res, 200, users)
};

userController.getUser = async(req, res, next) => {
    const { username } = req.params;
    const query = await User.findOne({ user: username });
    const user = {
        user: query.user,
        name: query.name,
        profile: query.profile,
        uptime: query.uptime,
        bytesIn: query.bytesIn,
        bytesOut: query.bytesOut,
        packetsIn: query.packetsIn,
        packetsOut: query.packetsOut,
        dynamic: query.dynamic,
        disabled: query.disabled,
    }
    responseMessage(res, 200, user)
};

userController.login = async(req, res, next) => {
    const login = {
        user: req.body.user,
        password: CryptoJS.HmacSHA1(req.body.password, secretCryptoKey)
    }

    const query = await User.findOne({ user: login.user })

    if (query == null) {
        responseMessage(res, 200, 'Error - Usuario no encontrado', true)
    } else {
        if (query.user == login.user) {
            if (query.password == login.password) {
                const user = {
                    user: query.user,
                    name: query.name,
                    profile: query.profile,
                    uptime: query.uptime,
                    bytesIn: query.bytesIn,
                    bytesOut: query.bytesOut,
                    packetsIn: query.packetsIn,
                    packetsOut: query.packetsOut,
                    dynamic: query.dynamic,
                    disabled: query.disabled,
                }
                responseMessage(res, 200, user)
            } else {
                responseMessage(res, 200, 'Error - Contraseña no coincide', true)
            }
        } else {
            responseMessage(res, 200, 'Error - Usuario Incorrecto', true)
        }
    }

};

// userController.createUser = async(req, res, next) => {
// const user = new User({
//     id: req.body.id,
//     name: req.body.name,
//     password: req.body.password,
//     profile: req.body.profile,
//     uptime: req.body.uptime,
//     bytesIn: req.body.bytesIn,
//     bytesOut: req.body.bytesOut,
//     packetsIn: req.body.packetsIn,
//     packetsOut: req.body.packetsOut,
//     dynamic: req.body.dynamic,
//     disabled: req.body.disabled,
// });
//     await user.save();
//     res.json({ status: 'Employee saved' });
// };

// userController.editUser = async(req, res, next) => {
//     const newUser = req.body;
//     await User.findByIdAndUpdate(req.params.id, newUser);
//     res.json({ status: 'Employee updated' });
// };

// userController.deleteUser = async(req, res, next) => {
//     await User.findByIdAndRemove(req.params.id);
//     res.json({ status: 'Employee deleted' });
// };

module.exports = userController;