var mysql = require('mysql');
const { cryptPassword } = require('./utils');
function createDB() {
    var con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
    });
    con.connect(function (err) {
        if (err) throw err;
        console.log("SQL Server Connected!");
    });
    con.query("CREATE DATABASE intrvu_2", function (err, result) {
        if (err) throw err;
        console.log("Database created");
    });
}

function connectDB() {
    var con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
        database: "intrvu_2"
    });
    con.connect(function (err) {
        if (err) throw err;
        console.log("Database Connected!");
    });
    return con;
}

function buildDB(con) {
    let create_users_query = "CREATE TABLE users (id INT(6) NOT NULL PRIMARY KEY AUTO_INCREMENT, fname VARCHAR(32) NOT NULL, lname VARCHAR(32) NULL, email VARCHAR(64) NOT NULL, password VARCHAR(256) NOT NULL, type INT(1) NOT NULL DEFAULT 0, CONSTRAINT email_unique UNIQUE(email))";
    con.query(create_users_query, function (err, result) {
        if (err) throw err;
        console.log("Users Table created");
    });
    let create_products_query = "CREATE TABLE products (id INT(6) NOT NULL PRIMARY KEY AUTO_INCREMENT, name VARCHAR(32) NOT NULL, description VARCHAR(1024) NULL, price FLOAT(10,2) NOT NULL, CONSTRAINT name_unique UNIQUE (name))";
    con.query(create_products_query, function (err, result) {
        if (err) throw err;
        console.log("Products Table created");
    });
    let create_orders_query = "CREATE TABLE orders (id INT(6) NOT NULL PRIMARY KEY AUTO_INCREMENT, product_id INT(6) NOT NULL, user_id INT(6) NOT NULL, quantity INT(10) NOT NULL DEFAULT 1, timestamp DATE NOT NULL DEFAULT CURRENT_TIMESTAMP, status INT(1) NOT NULL DEFAULT 1)";
    con.query(create_orders_query, function (err, result) {
        if (err) throw err;
        console.log("Orders Table created");
    });
}
// db initiate method
function initiateDB() {
    createDB();
    let con = connectDB();
    buildDB(con);
}

async function createUser(fname, lname, email, password, type = 0) {
    let con = connectDB();
    try {
        const result = await cryptPassword(password);
        console.log(result, "hp____")
        let insert_user_query = `INSERT INTO users (fname, lname, email, auth_string, type) VALUES ('${fname}', '${lname}', '${email}', '${result}', '${type}')`;
        if (result) {
            con.query(insert_user_query, function (err, result) {
                if (err) {console.log("error from from: ", err.code);};
                console.log(">>>>>>",result);
                return result;
            });
        } else {
            return undefined;
        }
    } catch (error) {
        console.log("Error: ", error.message);
        return undefined;
    }
}
function insertProduct(product_name, product_description, price) {
    return true;
}
function updateProduct(product_id, product_name, product_description, price) {

}
function deleteProduct(product_id) {

}
function getProducts() {
    return [];
}
function getOrdersBasedOnCustomers(customer_id, sort_type, sort_direction) {
    return [];
}
function getOderdProductsDateWise() {
    return [];
}
function getCustomersBasedOnTotalPurchaseCount() {
    return [];
}
function approveOrder(order_id) {
    return true;
}
module.exports = {
    connectDB,
    initiateDB,
    createUser,
    insertProduct,
    updateProduct,
    deleteProduct,
    getProducts,
    getOrdersBasedOnCustomers,
    getOderdProductsDateWise,
    getCustomersBasedOnTotalPurchaseCount,
    approveOrder
}