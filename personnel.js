class personnel{
    constructor(personnel_id,personnel_secret,personnel_firstname,personnel_lastname,personnel_isactive,position_id){
        this.personnel_id = personnel_id;
        this.personnel_secret = personnel_secret;
        this.personnel_firstname = personnel_firstname;
        this.personnel_lastname = personnel_lastname;
        this.personnel_isactive = personnel_isactive;
        this.position_id = position_id;
    }
}

module.exports = personnel;