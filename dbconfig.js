
var host = 'localhost';
if(process.env.NODE_ENV === 'production'){
    host = preocess.env.prodHost;
}

const config = {
    user :process.env.hostUser,
    password :process.env.hostPass,
    server:host,
    database:process.env.hostDB,
    options:{
        trustedconnection: true,
        enableArithAort : true,
        trustServerCertificate: true
    },
    port : 1433
}



module.exports = config;