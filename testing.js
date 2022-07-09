var mysql = require('mysql');

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "mysql"
  });
con.connect(function(err) {
    if (err) throw err;
});
con.query("SELECT * FROM user", function (err, result, fields) {
    if (err) throw err;
    console.log(result);
  });

  /**
   * 
   * CREATE TABLE `interview_3`.`users` ( `id` INT(4) NOT NULL AUTO_INCREMENT , `fname` VARCHAR(32) NOT NULL , `lname` VARCHAR(32) NULL , `email` VARCHAR(64) NOT NULL , `password` VARCHAR(256) NOT NULL , `type` INT(1) NOT NULL DEFAULT '0' , PRIMARY KEY (`id`(4))) ENGINE = InnoDB;
   * CREATE TABLE `interview_3`.`products` ( `id` INT(32) NOT NULL AUTO_INCREMENT , `name` VARCHAR(32) NOT NULL , `ldescription` VARCHAR(1024) NULL , `price` FLOAT(64) NOT NULL , PRIMARY KEY (`id`(4))) ENGINE = InnoDB;
   * CREATE TABLE `interview_3`.`orders` ( `id` INT(8) NOT NULL AUTO_INCREMENT , `product_id` INT(8) NOT NULL , `user_id` INT(8) NOT NULL , `quantity` INT(10) NOT NULL DEFAULT '1' , `timestamp` DATE NOT NULL DEFAULT CURRENT_TIMESTAMP , `status` INT(1) NOT NULL DEFAULT '1' , PRIMARY KEY (`id`(4))) ENGINE = InnoDB;
   *   
   * 
   * SELECT products.name, products.price, orders.quantity, orders.timestamp FROM orders INNER JOIN products ON orders.product_id = products.id group by product; 
   * SELECT products.name, sum(orders.quantity) FROM products LEFT JOIN sales ON products.sale_id = sales.id group by products.product_name,
   */
  /**
   * create user  <done>
   * login user <done>
   * upload product <done>
   * update product <done>
   * create order <done>
   * update order <done>
   * delete order <done>
   * get odered product based on customer <done>
   * get oderd count based on date<done>
   * coustomer list with total purchase
   * implement jwt token <done>
   * 
   * 
   */

   app.post('/confirm-order', authunticateRoute, (req, res) => {
    if (req.data) {
        let user_id = req.data.userId ? req.data.userId : undefined;
        let user_role = req.data.role != undefined ? req.data.role : undefined;
        if (user_id && user_role != undefined && user_role > 0) {
            let { order_id } = req.body;
            if (order_id == undefined || isNaN(order_id)) {
                res.status = 401;
                res.send("Invalid order id.");
            } else {
                let con = connectDB();
                if (con) {
                    let get_order_by_id = `SELECT status FROM orders WHERE id='${order_id}'`;
                    con.query(get_order_by_id, function (err, result) {
                        if (err) {
                            console.log("error from from: ", err.code);
                            res.status = 400;
                            res.send("Something went wrong, please try again.");
                        } else if (result.length > 0) {
                            result = result[0];
                            if (result.status == 1) {
                                // update order
                                let status = 0;
                                let update_order = `UPDATE orders SET status='${status}' WHERE id='${order_id}'`;
                                con.query(update_order, function (err, rslt) {
                                    if (err) {
                                        console.log("error from from: ", err);
                                        res.status = 400;
                                        res.send("Something went wrong, please try again");
                                    } else {
                                        res.status = 200;
                                        res.send('Order cancled successfully');
                                    }
                                });
                            } else {
                                res.status = 401;
                                res.send("Invalid order id.");
                            }
                        } else {
                            res.status = 401;
                            res.send("Invalid order id.");
                        }
                    });
                } else {
                    res.status = 400;
                    res.send("Something went wrong, please try again");
                }
            }
        } else {
            res.status = 403;
            res.send("unauthorized access, please login first.");
        }
    } else {
        res.status = 403;
        res.send("unauthorized access, please login first..");
    }
});


app.post('/update_product', authunticateRoute, (req, res) => {
    if (req.data) {
        let user_id = req.data.userId ? req.data.userId : undefined;
        let user_role = req.data.role ? req.data.role : undefined;
        if (user_id && user_role && user_role > 0) {
            let { product_name, description, price } = req.body;
            description = description && description.length > 0 ? description : undefined;
            if (price != undefined && price <= 0) {
                // return error
                res.status = 401;
                res.send("Price should be greater than 0.");
            } else {
                let con = connectDB();
                if (con) {
                    let get_product_by_name = `SELECT description, price FROM products WHERE name='${product_name}'`;
                    con.query(get_product_by_name, function (err, result) {
                        if (err) {
                            console.log("error from from: ", err.code);
                            res.status = 400;
                            res.send("Something went wrong, please try again.");
                        }
                        if (result.length > 0) {
                            result = result[0];
                            description = description?description:result.description;
                            price = price?price:result.price;
                            let update_product = `UPDATE products SET description='${description}', price='${price}' WHERE name='${product_name}'`;
                            con.query(update_product, function (err, rslt) {
                                if (err) {
                                    console.log("error from from: ", err);
                                    res.status = 400;
                                    res.send("Something went wrong, please try again");
                                } else {
                                    res.status = 200;
                                    res.send('Product uploaded successfully');
                                }
                            });
                        } else {
                            // no product found
                            res.status = 403;
                            res.send("Product not found");
                        }
                    });
                } else {
                    // return error
                    res.status = 400;
                    res.send("Something went wrong, please try again");
                }
            }
        } else {
            res.status = 403;
            res.send("unauthorized access, please login first");
        }
    } else {
        res.status = 403;
        res.send("unauthorized access, please login first");
    }
});
