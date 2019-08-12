// Dependencies
const RosApi = require('node-routeros').RouterOSAPI
const CryptoJS = require("crypto-js")
const atob = require("atob")
const btoa = require("btoa")

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

const functionLogin = async(res, session) => {
    const query = await User.findOne({ user: session.user })

    if (query == null) {
        responseMessage(res, 200, 'Usuario no encontrado', true)
    } else {
        if (query.user == session.user) {
            if (query.password == session.password) {
                conn.connect()
                    .then(() => {
                        conn.write('/ip/hotspot/user/print', `?name=${session.user}`)
                            .then((data) => {
                                const session = {
                                    user: query.user,
                                    password: query.password
                                }

                                const user = {
                                    user: query.user,
                                    name: query.name,
                                    profile: query.profile,
                                    uptime: data[0].uptime,
                                    bytesIn: formatBytes(data[0]['bytes-in']),
                                    bytesOut: formatBytes(data[0]['bytes-out']),
                                    packetsIn: data[0]['packets-in'],
                                    packetsOut: data[0].disabled,
                                    disabled: data[0].disabled,
                                    admin: query.admin,
                                    session: btoa(JSON.stringify(session))
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


userController.mikrotikCreateUsers = (req, res, next) => {
    conn.connect()
        .then(() => {
            conn.write('/ip/hotspot/user/print')
                .then((data) => {
                    let user
                    for (let i = 1; i < data.length; i++) {
                        let admin
                        if (data[i].name == 'admin' || data[i].name == 'humberto') {
                            admin = true
                        } else {
                            admin = false
                        }

                        user = new User({
                            id: data[i]['.id'],
                            user: data[i].name,
                            name: null,
                            password: CryptoJS.HmacSHA1(data[i].password, secretCryptoKey),
                            profile: data[i].profile,
                            disabled: data[i].disabled,
                            admin,
                        })
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

userController.login = (req, res, next) => {
    const session = {
        user: req.body.user,
        password: CryptoJS.HmacSHA1(atob(req.body.password), secretCryptoKey).toString()
    }

    functionLogin(res, session)
}

userController.reLogin = (req, res, next) => {
    const session = JSON.parse(atob(req.body.cookieSession))

    functionLogin(res, session)
}

userController.addUser = async(req, res, next) => {
    const { user, profile } = req.body

    conn.connect()
        .then(() => {
            conn.write('/ip/hotspot/user/add', [`=name=${user}`, '=password=12345', `=profile=${profile}`])
                .then(() => {
                    conn.write('/ip/hotspot/user/print', `?name=${user}`)
                        .then(data => {
                            let newUser = new User({
                                id: data[0]['.id'],
                                user: data[0].name,
                                name: null,
                                password: CryptoJS.HmacSHA1(data[0].password, secretCryptoKey),
                                profile: data[0].profile,
                                disabled: data[0].disabled,
                                admin: false,
                            })
                            newUser.save()
                            responseMessage(res, 200, 'User added successfully')
                        })
                        .catch(err => {
                            responseMessage(res, 500, 'Error desconocido, intente más tarde', true)
                        });
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
    const query = await User.find().sort({ user: 1 })
    let users = []

    for (let i = 0; i < query.length; i++) {
        users.push({
            admin: query[i].admin,
            disabled: query[i].disabled,
            name: query[i].name,
            password: query[i].password,
            profile: query[i].profile,
            user: query[i].user,
            id: query[i].id,
        })
    }

    responseMessage(res, 200, users)
}

userController.getUser = async(req, res, next) => {
    const { username } = req.params
    const query = await User.findOne({ user: username })
    const user = {
        user: query.user,
        name: query.name,
        profile: query.profile,
        disabled: query.disabled,
        admin: query.admin,
    }
    responseMessage(res, 200, user)
}

userController.updateUser = async(req, res, next) => {
    const user = req.body
    const queryGet = await User.findOne({ user: user.user })

    let updateUser = queryGet
    updateUser.name = user.name

    const queryUpdate = await User.updateOne({ _id: Object(updateUser._id) }, updateUser)

    responseMessage(res, 200, user)
}

userController.deleteUser = async(req, res, next) => {
    const { id } = req.body

    const queryGet = await User.findOne({ id })
    const queryDelete = await User.deleteOne({ _id: Object(queryGet._id) });

    conn.connect()
        .then(() => {
            conn.write('/ip/hotspot/user/remove', `=.id=${id}`)
                .then(data => {
                    responseMessage(res, 200, 'User successfully deleted')
                })
                .catch(err => {
                    responseMessage(res, 400, 'Mikrotik - Bad Request')
                })
        })
        .catch(err => {
            responseMessage(res, 400, 'Mikrotik - Connection failed')
        })
}

userController.disableUser = async(req, res, next) => {
    const { id } = req.body

    const queryGet = await User.findOne({ id })

    let updateUser = queryGet
    updateUser.disabled = true

    const queryUpdate = await User.updateOne({ _id: Object(updateUser._id) }, updateUser)

    conn.connect()
        .then(() => {
            conn.write('/ip/hotspot/user/disable', `=.id=${id}`)
                .then(data => {
                    responseMessage(res, 200, 'User successfully deactivated')
                })
                .catch(err => {
                    responseMessage(res, 400, 'Mikrotik - Bad Request')
                })
        })
        .catch(err => {
            responseMessage(res, 400, 'Mikrotik - Connection failed')
        })
}

userController.enableUser = async(req, res, next) => {
    const { id } = req.body

    const queryGet = await User.findOne({ id })

    let updateUser = queryGet
    updateUser.disabled = false

    const queryUpdate = await User.updateOne({ _id: Object(updateUser._id) }, updateUser)

    conn.connect()
        .then(() => {
            conn.write('/ip/hotspot/user/enable', `=.id=${id}`)
                .then(data => {
                    responseMessage(res, 200, 'User successfully deactivated')
                })
                .catch(err => {
                    responseMessage(res, 400, 'Mikrotik - Bad Request')
                })
        })
        .catch(err => {
            responseMessage(res, 400, 'Mikrotik - Connection failed')
        })
}

userController.typeAdminUser = async(req, res, next) => {
    const { id } = req.body

    const queryGet = await User.findOne({ id })

    let updateUser = queryGet
    updateUser.admin = true

    const queryUpdate = await User.updateOne({ _id: Object(updateUser._id) }, updateUser)

    responseMessage(res, 200, 'User is now an administrator')
}

userController.typeDefaultUser = async(req, res, next) => {
    const { id } = req.body

    const queryGet = await User.findOne({ id })

    let updateUser = queryGet
    updateUser.admin = false

    const queryUpdate = await User.updateOne({ _id: Object(updateUser._id) }, updateUser)

    responseMessage(res, 200, 'User is now not an administrator')
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