// Dependencies
const CryptoJS = require("crypto-js")
const atob = require("atob")
const RosApi = require('node-routeros').RouterOSAPI

// Models
const User = require('../models/user')

const userController = {};

const conn = new RosApi({
    host: '10.0.8.1',
    user: 'admin',
    password: 'mafafa',
    keepalive: true
})

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

const formatBytes = (bytes) => {
    if (bytes >= 1073741824) {
        bytes = (bytes / 1073741824).toFixed(2) + " GB"
    } else if (bytes >= 1048576) {
        bytes = (bytes / 1048576).toFixed(2) + " MB"
    } else if (bytes >= 1024) {
        bytes = (bytes / 1024).toFixed(2) + " KB"
    } else if (bytes > 1) {
        bytes = bytes + " Bytes"
    } else if (bytes == 1) {
        bytes = bytes + " Byte"
    } else {
        bytes = "0 Bytes"
    }
    return bytes
}


userController.mikrotikCreateUsers = (req, res, next) => {
    conn.connect()
        .then(() => {
            conn.write('/ip/hotspot/user/print')
                .then((data) => {
                    let user
                    for (let i = 1; i < data.length; i++) {
                        if (data[i].name == 'admin' || data[i].name == 'humberto') {
                            user = new User({
                                id: data[i]['.id'],
                                user: data[i].name,
                                name: null,
                                password: CryptoJS.HmacSHA1(data[i].password, secretCryptoKey),
                                profile: data[i].profile,
                                dynamic: data[i].dynamic,
                                disabled: data[i].disabled,
                                admin: true,
                            })
                        } else {
                            user = new User({
                                id: data[i]['.id'],
                                user: data[i].name,
                                name: null,
                                password: CryptoJS.HmacSHA1(data[i].password, secretCryptoKey),
                                profile: data[i].profile,
                                dynamic: data[i].dynamic,
                                disabled: data[i].disabled,
                                admin: false,
                            })
                        }
                        user.save()
                    }

                    responseMessage(res, 200, 'Successfully created users')
                })
                .catch(err => {
                    responseMessage(res, 400, 'Mikrotik - Bad Request')
                })
        })
        .catch(err => {
            responseMessage(res, 400, 'Mikrotik - Connection failed')
        })
}

userController.getUsers = async(req, res, next) => {
    const users = await User.find()
    responseMessage(res, 200, users)
}

userController.getUser = async(req, res, next) => {
    const { username } = req.params
    const query = await User.findOne({ user: username })
    const user = {
        user: query.user,
        name: query.name,
        profile: query.profile,
        dynamic: query.dynamic,
        disabled: query.disabled,
        admin: query.admin,
    }
    responseMessage(res, 200, user)
}

userController.login = async(req, res, next) => {
    const login = {
        user: req.body.user,
        password: CryptoJS.HmacSHA1(atob(req.body.password), secretCryptoKey).toString()
    }
    const query = await User.findOne({ user: login.user })

    if (query == null) {
        responseMessage(res, 200, 'Usuario no encontrado', true)
    } else {
        if (query.user == login.user) {
            if (query.password == login.password) {
                conn.connect()
                    .then(() => {
                        conn.write('/ip/hotspot/user/print', `?name=${login.user}`)
                            .then((data) => {
                                const user = {
                                    user: query.user,
                                    name: query.name,
                                    profile: query.profile,
                                    uptime: data[0].uptime,
                                    bytesIn: formatBytes(data[0]['bytes-in']),
                                    bytesOut: formatBytes(data[0]['bytes-out']),
                                    packetsIn: data[0]['packets-in'],
                                    packetsOut: data[0].disabled,
                                    dynamic: query.dynamic,
                                    disabled: query.disabled,
                                    admin: query.admin,
                                }
                                responseMessage(res, 200, user)
                            })
                            .catch(err => {
                                responseMessage(res, 500, 'Error desconocido, intente más tarde', true)
                            });
                    })
                    .catch(err => {
                        responseMessage(res, 500, 'Mikrotik - Conexión fallida', true)
                    });
            } else {
                responseMessage(res, 200, 'Contraseña no coincide', true)
            }
        } else {
            responseMessage(res, 200, 'Usuario Incorrecto', true)
        }
    }

}

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