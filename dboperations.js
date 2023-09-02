require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` });
const jwtDecode = require("jwt-decode");
var config = require("./dbconfig");
const sql = require("mssql");
const bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");

async function getAllPSNData() {
  console.log("let getAllPSN");
  const result = await fetch(
    `http://${process.env.backendHost}:${process.env.himsPort}/api/himspsn/getallpsn`
  )
    .then((response) => response.json())
    .then((data) => {
      console.log("getAllPSN complete");
      return data;
    })
    .catch((error) => {
      if (error.name === "AbortError") {
        console.log("cancelled");
      } else {
        console.error("Error:", error);
      }
    });
  return result;
}

async function genJWT(psn_id, psn_name) {
  let pool = await sql.connect(config);
  let lvList = await pool
    .request()
    .input("psn_id", sql.VarChar, psn_id)
    .query(
      "SELECT psn_lv_list.lv_id, psn_lv_list.view_id, psn_lv.mihapp_id FROM psn_lv_list " +
        "INNER JOIN psn_lv ON psn_lv.id = psn_lv_list.lv_id WHERE psn_id = @psn_id"
    );
  var token = jwt.sign(
    {
      psn_id: psn_id,
      psn_name: psn_name,
      lv_list: lvList.recordset,
    },
    process.env.privateKey,
    { expiresIn: '4h', issuer: process.env.iss, algorithm: "HS256" }
  );
  console.log("jwt prepare complete = " + token);
  return token;
}

async function login(data) {
  try {
    console.log("login id = " + data.psn_id + " try connect to server");
    let pool = await sql.connect(config);
    console.log("connect complete");
    const himsPsn = await getAllPSNData();
    const result = await pool
      .request()
      .input("psn_id", sql.VarChar, data.psn_id)
      .query("SELECT * FROM psn WHERE id = @psn_id");
    const psn = result.recordset[0];
    console.log("check id = " + data.psn_id + " from HIMS database");
    let foundIndex = -1;
    for (let i = 0; i < himsPsn.length; i += 1) {
      if (data.psn_id === himsPsn[i].psn_id) {
        foundIndex = i;
        break;
      }
    }
    if (foundIndex !== -1) {
      console.log("found id = " + data.psn_id + " from HIMS");
      if (psn !== undefined && psn.length != 0) {
        console.log("found id = " + data.psn_id + " from psn");
        const match = await bcrypt.compare(data.psn_secret, psn.secret);
        if (match) {
          console.log("password matched");
          if (psn.exp_date <= new Date()) {
            console.log("password expire");
            console.log("====================");
            return {
              status: "expire",
              message: "กรุณาเปลี่ยนรหัสผ่านใหม่เนื่องจากรหัสผ่านหมดอายุ",
            };
          } else {
            console.log("login id = " + data.psn_id + " success");
            const token = await genJWT(
              data.psn_id,
              himsPsn[foundIndex].pname +
                "" +
                himsPsn[foundIndex].fname +
                " " +
                himsPsn[foundIndex].lname
            );
            console.log("====================");
            return { status: "ok", message: "เข้าสู่ระบบสำเร็จ", token };
          }
        } else {
          console.log("wrong password");
          console.log("====================");
          return { status: "error", message: "รหัสผ่านผิด" };
        }
      } else {
        console.log(
          "not found id = " +
            data.psn_id +
            " from personnel, check default password"
        );
        if (data.psn_secret === himsPsn[foundIndex].bdate) {
          console.log(
            "default password found, response with message password change needed"
          );
          const token = await genJWT(
            data.psn_id,
            himsPsn[foundIndex].pname +
              "" +
              himsPsn[foundIndex].fname +
              " " +
              himsPsn[foundIndex].lname
          );
          console.log("====================");
          return {
            status: "expire",
            message: "กรุณาเปลี่ยนรหัสผ่านใหม่เนื่องจากเข้าสู่ระบบครั้งแรก",
            token,
          };
        } else {
          console.log("wrong password");
          console.log("====================");
          return { status: "error", message: "รหัสผ่านผิด" };
        }
      }
    } else {
      console.log("id = " + data.psn_id + " not found");
      console.log("====================");
      return { status: "error", message: "ไม่พบชื่อผู้ใช้" };
    }
  } catch (error) {
    console.error(error);
    return { status: "error", message: error.message };
  }
}

async function authen(token) {
  try {
    console.log("authen request from " + token);
    console.log("====================");
    var decoded = jwt.verify(token, process.env.privateKey);
    return { status: "ok", data: decoded };
  } catch (error) {
    console.error(error);
    return { status: "error", message: error.message };
  }
}

async function verify(psn_id, psn_secret) {
  try {
    console.log("verify request try connect to server");
    let pool = await sql.connect(config);
    console.log("connect complete");
    let result = await pool
      .request()
      .input("psn_id", sql.VarChar, psn_id)
      .query(
        "SELECT secret FROM psn WHERE id = @psn_id"
      );
    console.log("verify for id = " + psn_id);
    if (result.recordset.length != 0) {
      const match = await bcrypt.compare(
        psn_secret,
        result.recordset[0].secret
      );
      if (match) {
        console.log("verify for " + psn_id + " success");
        console.log("====================");
        return { status: "ok", message: "ตรวจสอบสำเร็จ" };
      } else {
        console.log("verify for " + psn_id + " fail secret not match");
        console.log("====================");
        return { status: "error", message: "รหัสผ่านยืนยันไม่ถูกต้อง" };
      }
    } else {
      console.log("data for " + psn_id + " not found");
      console.log("====================");
      return { status: "error", message: "ไม่พบชื่อผู้ใช้" };
    }
  } catch (error) {
    console.error(error);
    return { status: "error", message: error.message };
  }
}

async function secretChg(data, token) {
  try {
    console.log(
      "secret change for id = " + data.psn_id + ", try connect to server"
    );
    let pool = await sql.connect(config);
    console.log("connect complete");
    const dToken = jwtDecode(token);
    if (data.psn_id === dToken.psn_id) {
      let hash_secret = "";
      if (data.psn_secret.length < 30) {
        hash_secret = await bcrypt.hash(
          data.psn_secret,
          parseInt(process.env.saltRounds)
        );
        console.log("hashing password complete");
        await pool
          .request()
          .input("psn_id", sql.VarChar, data.psn_id)
          .input("psn_secret", sql.VarChar, hash_secret)
          .query(
            "BEGIN TRY" +
              " INSERT INTO psn (id, secret, exp_date)" +
              " VALUES (@psn_id, @psn_secret, DATEADD(day, 90, GETDATE()))" +
              " END TRY" +
              " BEGIN CATCH" +
              " IF ERROR_NUMBER() IN (2601, 2627)" +
              " UPDATE psn SET secret = @psn_secret, exp_date = DATEADD(day, 90, GETDATE())" +
              " WHERE id = @psn_id" +
              " END CATCH"
          );
        console.log("secret change complete");
        console.log("====================");
        return { status: "ok" };
      } else {
        console.log("new password too long");
        return {
          status: "error",
          message: "รหัสผ่านต้องไม่ยาวเกิน 30 ตัวอักษร",
        };
      }
    } else {
      console.log("personnel id not match");
      return { status: "error", message: "unauthorized" };
    }
  } catch (error) {
    console.error(error);
    return { status: "error", message: error.message };
  }
}

module.exports = {
  login: login,
  authen: authen,
  verify: verify,
  secretChg: secretChg,
};
