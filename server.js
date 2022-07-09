const express = require('express');
const app = express();
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bodyparser = require('body-parser');
const { validateEmail, validatePassword, cryptPassword, comparePassword } = require('./utils');
const { connectDB } = require('./initiateDB');
const { authunticateRoute } = require('./middleware');
const e = require('express');
// app.use(express.json());
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
app.use(cors({
    origin: '*'
}));
dotenv.config();

const PORT = process.env.PORT;

app.post('/register', (req, res) => {
    const { fname, lname, email, password, type } = req.body;
    if (fname.length == 0) {
        res.status = 401;
        res.send('First name is required');
    } else if (email == undefined || !validateEmail(email)) {
        res.status = 401;
        res.send('Invalid email formate');
    } else if (password == undefined || !validatePassword(password)) {
        res.status = 401;
        res.send('Password must contain a number, a capital character, and one small character and its length should be between 6 to 20');
    } else {
        cryptPassword(password).then((hash) => {
            if (hash) {
                let con = connectDB();
                if (con) {
                    let insert_user_query = `INSERT INTO users (fname, lname, email, auth_string, type) VALUES ('${fname}', '${lname}', '${email}', '${hash}', '${type ? type : 0}')`;
                    con.query(insert_user_query, function (err, result) {
                        if (err) {
                            console.log("error from from: ", err.code);
                            res.status = 400;
                            res.send("Email already exiest, please try with another email.");
                        };
                        res.status = 200;
                        res.send('User created successfully');
                    });
                } else {
                    res.status = 401;
                    res.send('Something went wrong, please try again later.')
                }
            } else {
                res.status = 401;
                res.send('Something went wrong, please try again later.')
            }
        })
    }
})
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    console.log(email, password, req.body);
    if (email == undefined || password == undefined) {
        res.status = 401;
        res.send('You must provide email and password.');
    } else if (!validateEmail(email)) {
        res.status = 401;
        res.send('Invalid email formate');
    } else if (!validatePassword(password)) {
        res.status = 401;
        res.send('Password must contain a number, a capital character, and one small character and its length should be between 6 to 20');
    } else {
        let con = connectDB();
        if (con) {
            let get_user_from_email = `SELECT id, auth_string, type FROM users WHERE email='${email}'`;
            con.query(get_user_from_email, function (err, result) {
                if (err) {
                    console.log("error from from: ", err.code);
                    res.status = 400;
                    res.send("Email already exiest, please try with another email.");
                };
                if (result.length > 0) {
                    result = result[0];
                    let auth_string = result ? result.auth_string ? result.auth_string : undefined : undefined;
                    if (auth_string != undefined) {
                        comparePassword(password, auth_string).then((isvalid) => {
                            console.log(isvalid);
                            if (isvalid) {
                                let jwtSecretKey = process.env.JWT_SECRET_KEY;
                                let data = {
                                    time: Date(),
                                    userId: result.id,
                                    role: result.type
                                }
                                const token = jwt.sign(data, jwtSecretKey);
                                res.status = 200;
                                res.send({
                                    user_id: result.id,
                                    user_type: result.type,
                                    token: token
                                });
                            } else {
                                res.status = 400;
                                res.send('Invalid email or Password');
                            }
                        }).catch((err) => {
                            console.log(err.message)
                            res.status = 400;
                            res.send('Invalid email or Password');
                        })
                    } else {
                        res.status = 400;
                        res.send("Invalid user.")
                    }
                } else {
                    res.status = 400;
                    res.send('Invalid email or Password')
                }
            });
        } else {
            res.status = 401;
            res.send('Something went wrong, please try again');
        }
    }
})

app.post('/upload-product', authunticateRoute, (req, res) => {
    if (req.data) {
        let user_id = req.data.userId ? req.data.userId : undefined;
        let user_role = req.data.role ? req.data.role : undefined;
        if (user_id && user_role && user_role > 0) {
            let { product_name, description, price } = req.body;
            description = description ? description.length > 0 ? description : '' : '';
            if (product_name == undefined || product_name.length == 0) {
                res.status = 401;
                res.send('Product name is required');
            } else if (price <= 0) {
                res.status = 401;
                res.send("Price should be greater than zero");
            } else {
                // find product name is already exist or not
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
                            // update previous product
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
                            // create new product
                            let create_new_product = `INSERT INTO products (name, description, price) VALUES ('${product_name}', '${description}', '${price}')`;
                            con.query(create_new_product, function (err, rslt) {
                                if (err) {
                                    console.log("error from from: ", err.code);
                                    res.status = 400;
                                    res.send("Something went wrong, please try again");
                                } else {
                                    res.status = 200;
                                    res.send('Product uploaded successfully');
                                }
                            });
                        }
                    });
                } else {
                    res.status = 401;
                    res.send('Something went wrong, please try again');
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
app.post('/create-order', authunticateRoute, (req, res)=>{
    if (req.data) {
        console.log(req.data);
        let user_id = req.data.userId ? req.data.userId : undefined;
        let user_role = req.data.role != undefined ? req.data.role : undefined;
        if (user_id && user_role != undefined && user_role == 0) {
            let { product_id, quantity } = req.body;
            if (product_id && quantity && quantity > 0) {
                // check for product id
                let con = connectDB();
                if (con) {
                    let get_product_by_id = `SELECT name FROM products WHERE id='${product_id}'`;
                    con.query(get_product_by_id, function (err, result) {
                        if (err) {
                            console.log("error from from: ", err.code);
                            res.status = 400;
                            res.send("Something went wrong, please try again.");
                        }
                        if (result.length > 0) {
                            let create_order = `INSERT INTO orders (product_id, user_id, quantity) VALUES ('${product_id}', '${user_id}', '${quantity}')`;
                            con.query(create_order, function (err, rslt) {
                                if (err) {
                                    console.log("error from from: ", err.code);
                                    res.status = 400;
                                    res.send("Something went wrong, please try again");
                                } else {
                                    res.status = 200;
                                    res.send('Order placed successfully');
                                }
                            });
                        } else {
                            res.status = 401;
                            res.send("Invalid product id.");
                        }
                    });
                } else {
                    res.status = 400;
                    res.send("Something went wrong, please try again.");
                }
            } else {
                res.status = 401;
                res.send("Please provide product id and quantity of order");
            }
        } else {
            res.status = 403;
            res.send("unauthorized access, please login first.");
        }
    } else {
        res.status = 403;
        res.send("unauthorized access, please login first>>");
    }
})

app.post('/update-order', authunticateRoute, (req, res) => {
    if (req.data) {
        let user_id = req.data.userId ? req.data.userId : undefined;
        let user_role = req.data.role != undefined ? req.data.role : undefined;
        if (user_id && user_role != undefined && user_role == 0) {
            let { order_id, quantity } = req.body;
            if (order_id == undefined || isNaN(order_id)) {
                res.status = 401;
                res.send("Invalid order id.");
            }else if (quantity == undefined || isNaN(quantity) || quantity <= 0) {
                res.status = 401;
                res.send("Invalid quantity.");
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
                                let update_order = `UPDATE orders SET quantity='${quantity}' WHERE id='${order_id}'`;
                                con.query(update_order, function (err, rslt) {
                                    if (err) {
                                        console.log("error from from: ", err);
                                        res.status = 400;
                                        res.send("Something went wrong, please try again");
                                    } else {
                                        res.status = 200;
                                        res.send('Order updated successfully');
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


app.post('/cancel-order', authunticateRoute, (req, res) => {
    if (req.data) {
        let user_id = req.data.userId ? req.data.userId : undefined;
        let user_role = req.data.role != undefined ? req.data.role : undefined;
        if (user_id && user_role != undefined && user_role == 0) {
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
                            console.log("error from from: ", err);
                            res.status = 400;
                            res.send("Something went wrong, please try again.");
                        } else if (result.length > 0) {
                            console.log(result)
                            result = result[0];
                            if (result.status == 1) {
                                // update order
                                let status = -1;
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
                                res.send("Invalid order id..");
                            }
                        } else {
                            res.status = 401;
                            res.send("Invalid order id...");
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

app.post('/user-orderd-products', authunticateRoute, (req, res) => {
    if (req.data) {
        let user_id = req.data.userId ? req.data.userId : undefined;
        let user_role = req.data.role != undefined ? req.data.role : undefined;
        if (user_id && user_role != undefined && user_role == 0) {
            let { sort_direction, search_word, sort_by } = req.body;
            sort_direction = sort_direction == "-1"?"DESC":'ASC';
            search_word = search_word?search_word:'';
            sort_by = sort_by == "product_name"?"products.name":'products.price';
            
            let con = connectDB();
            if (con) {
                let get_order_by_user = `SELECT products.name, products.price FROM orders INNER JOIN products ON orders.product_id = products.id WHERE products.name LIKE '%${search_word}%' AND user_id = '${user_id}' GROUP BY products.name ORDER BY ${sort_by} ${sort_direction}`;
                con.query(get_order_by_user, function (err, result) {
                    if (err) {
                        console.log("error from from: ", err.code);
                        res.status = 400;
                        res.send("Something went wrong, please try again.");
                    } else if (result.length > 0) {
                        res.status = 200;
                        res.send(result);
                    } else {
                        res.status = 200;
                        res.send(result);
                    }
                });
            } else {
                res.status = 400;
                res.send("Something went wrong, please try again");
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

app.post('/orders-on-date', authunticateRoute, (req, res) => {
    if (req.data) {
        let user_id = req.data.userId ? req.data.userId : undefined;
        let user_role = req.data.role != undefined ? req.data.role : undefined;
        if (user_id && user_role != undefined && user_role > 0) {
            let date = req.body.date?req.body.date:new Date().getFullYear()+"-"+(new Date().getMonth()+1)+'-'+new Date().getDate();
            let con = connectDB();
            console.log(date);
            if (con) {
                let get_order_by_user = `SELECT products.name, sum(orders.quantity) FROM orders INNER JOIN products ON orders.product_id = products.id WHERE timestamp = '${date}' GROUP BY products.name`;
                con.query(get_order_by_user, function (err, result) {
                    if (err) {
                        console.log("error from from: ", err.code);
                        res.status = 400;
                        res.send("Something went wrong, please try again.");
                    } else if (result.length > 0) {
                        res.status = 200;
                        res.send(result);
                    } else {
                        res.status = 200;
                        res.send(result);
                    }
                });
            } else {
                res.status = 400;
                res.send("Something went wrong, please try again");
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
app.post('/customer-by-purchase', authunticateRoute, (req, res) => {
    if (req.data) {
        let user_id = req.data.userId ? req.data.userId : undefined;
        let user_role = req.data.role != undefined ? req.data.role : undefined;
        if (user_id && user_role != undefined && user_role > 0) {
            let con = connectDB();
            if (con) {
                let get_order_by_user = `SELECT users.fname, users.lname, sum(orders.quantity) FROM orders INNER JOIN users ON orders.user_id = users.id GROUP BY orders.user_id`;
                con.query(get_order_by_user, function (err, result) {
                    if (err) {
                        console.log("error from from: ", err);
                        res.status = 400;
                        res.send("Something went wrong, please try again.");
                    } else if (result.length > 0) {
                        res.status = 200;
                        res.send(result);
                    } else {
                        res.status = 200;
                        res.send(result);
                    }
                });
            } else {
                res.status = 400;
                res.send("Something went wrong, please try again");
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
app.listen(PORT, function () {
    console.log("Server started on port: ", PORT);
})