require("dotenv").config()

module.exports = function(){
    this.conn = function(){
        const mysql = require("mysql")
        const conn = mysql.createConnection({
            host:       process.env.HOST_DB,
            user:       process.env.USER_DB,
            password:   process.env.PASS_DB,
            database:   process.env.DB
        })
        return conn
    }
}