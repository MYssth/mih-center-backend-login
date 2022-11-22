require('dotenv').config();
var config = require('./dbconfig');
const sql = require('mssql');
const bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');

async function login(personnel) {

    try {
        console.log("login request try to connect server");
        let pool = await sql.connect(config);
        console.log("connect complete");
        let result = await pool.request().input('personnel_id', sql.VarChar, personnel.personnel_id).query("SELECT * FROM personnel WHERE personnel_id = @personnel_id");
        console.log("Login check id = " + personnel.personnel_id);
        if (result.recordset.length != 0) {
            console.log("ID found checking password");
            const match = await bcrypt.compare(personnel.personnel_secret, result.recordset[0].personnel_secret);
            if (match) {
                console.log("Login success");
                var token = jwt.sign({ "personnel_id": personnel.personnel_id }, process.env.privateKey, { expiresIn: "10h" });
                console.log("====================");
                return { "status": "ok", "message": "เข้าสู่ระบบสำเร็จ", token };
            }
            else {
                console.log("Wrong password");
                console.log("====================");
                return { "status": "error", "message": "รหัสผ่านไม่ถูกต้อง" };
            }
        }
        else {
            console.log("User not found");
            console.log("====================");
            return { "status": "error", "message": "ไม่พบชื่อผู้ใช้" };
        }
    }
    catch (error) {
        console.error(error);
        return { "status": "error", "message": error.message };
    }
}

async function authen(token) {

    try {
        console.log("authen request");
        console.log("====================");
        var decoded = jwt.verify(token, process.env.privateKey);
        return { "status": "ok", decoded };
    }
    catch (error) {
        console.error(error);
        return { "status": "error", "message": error.message };
    }

}

module.exports = {
    login: login,
    authen: authen,
}