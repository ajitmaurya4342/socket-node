const mysql = require('mysql2')

const _p = mysql.createPool({
    host: '160.153.16.9',
    database: 'well_management',
    password: 'ppt_quiz',
    user: 'ppt_quiz'
})


module.exports = _p.promise()