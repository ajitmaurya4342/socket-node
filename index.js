const express = require("express");
const path = require("path");
var bodyParser = require("body-parser");
const PORT = process.env.PORT || 5000;
const app = express();
var appTest = require("./api.js");
const db = require("./config/database");
const _ws = require("ws").Server;
const http = require("http");

//console.log('http :', http);

// db.authenticate()
//   .then(() =>
//     console.log(
//       "^^%&%^&^%^$%^&$%%^$%^$^ Wolla Connected to DB ^^%&%^&^%^$%^&$%%^$%^$^"
//     )
//   )
//   .catch((err) => console.log(`DB Connection failed ${err.message}`));

app.use(bodyParser.json());

app.use("", appTest);
app.get("/", (req, res) => {
    console.log(req.query);
    let start = 50;
    let page_no = req.query.page_no * start;

    db.query(
            "SELECT  *,DATE_FORMAT(created_date, '%Y/%m/%d %H:%i %p' ) AS LastSeen  FROM chat_user where isActive=1 and id!='" +
            req.query.id +
            "' limit " +
            page_no +
            "," +
            start +
            ""
        )
        .then((response) => res.send(response[0]))
        .catch((err) => console.log(`DB Connection failed ${err.message}`));
    // res.send({
    //   obj: "fdsfsd",
    // });
});

app.get("/getChatList", (req, res) => {
    //console.log(req.query);
    let start = 30;
    let page_no = req.query.page_no * start;
    let sql_date =
        "SELECT  *,DATE_FORMAT(creation_date, '%Y/%M/%d')  as MainDate,DATE_FORMAT(creation_date, '%h:%i %p' ) AS SentDate from chat_details where ((from_id='" +
        req.query.from_id +
        "' and  to_id='" +
        req.query.to_id +
        "') or  (from_id='" +
        req.query.to_id +
        "' and to_id='" +
        req.query.from_id +
        "'))  Order by creation_date DESC limit " +
        page_no +
        "," +
        start +
        "";

    db.query(sql_date)
        .then((response) => res.send(response[0]))
        .catch((err) => console.log(`DB Connection failed ${err.message}`));
    // res.send({
    //   obj: "fdsfsd",
    // });
});

app.get("/getAllChatTalk", (req, res) => {
    //console.log(req.query);
    let start = 30;
    let page_no = req.query.page_no * start;

    let sql2 =
        "select *,DATE_FORMAT(A.date_created, '%Y/%m/%d %H:%i %p' ) as lastDate,DATE_FORMAT(B.created_date, '%Y/%m/%d %H:%i %p' ) AS LastSeen from chat_all_detail A inner join chat_user B on A.user_to_id=B.id where A.user_from_id='" +
        req.query.id +
        "' ORDER BY A.date_created DESC limit " +
        page_no +
        "," +
        start +
        " ";

    let sql_date =
        "SELECT from_id,COUNT(chat_id) as unread,msg,creation_date FROM chat_details WHERE msg_status = 1 AND to_id = '" +
        req.query.id +
        "' GROUP BY from_id  ORDER BY creation_date DESC";

    db.query(sql2)
        .then((response) => {
            if (page_no == 0) {
                db.query(sql_date).then((response2) => {
                    res.send({
                        dataAllUnread: response2[0],
                        getList: response[0],
                    });
                });
            } else {
                res.send({
                    dataAllUnread: [],
                    getList: response[0],
                });
            }
        })
        .catch((err) => console.log(`DB Connection failed ${err.message}`));
    // res.send({
    //   obj: "fdsfsd",
    // });
});

app.get("/doOfline", (req, res) => {
    let sql2 = "update chat_user set isOnline='" + req.query.data + "' where id=" + req.query.id;
    db.query(sql2).then((response) => {
        res.send({
            msg: "successfully offline",
        });
    });
    // res.send({
    //   obj: "fdsfsd",
    // });
});

app.get("/getPortNumber", (req, res) => {
    //res.sendFile(path.join(__dirname + '/public/index.html'));
    res.json({ port: PORT });
});

app.post("/insert", (req, res) => {
    //console.log(req.body, "fsfsdf");
    let obj = {
        email: req.body.email,
        phone: req.body.phone,
        name: req.body.name,
        isActive: 1,
        isOnline: 0,
    };

    let sql =
        "insert into  chat_user(user_name,email,phone_number,isActive,isOnline) values ('" +
        req.body.name +
        "','" +
        req.body.email +
        "'," +
        req.body.phone +
        ",'1','0')";

    let sql2 = "select * from chat_user where phone_number=" + req.body.phone;
    db.query(sql2)
        .then((response) => {
            if (response[0].length > 0) {
                res.send({
                    userDetail: response[0],
                    msg: "Updated",
                });
            } else {
                db.query(sql)
                    .then((response1) => {
                        obj["id"] = response1[0]["insertId"];
                        res.send({
                            userDetail: [obj],
                            msg: "Inserted",
                        });
                    })
                    .catch((err) => console.log(`DB Connection failed ${err.message}`));
            }
        })
        .catch((err) => console.log(`DB Connection failed ${err.message}`));
});

var tm = [];

var _total = 0;
const server = http.createServer(app);

server.listen(PORT, () => {
    console.log(`the server is running on ${PORT} and date is ${new Date()}`);
});
var ser = new _ws({
    // WebSocket server is tied to a HTTP server. WebSocket
    // request is just an enhanced HTTP request. For more info
    // http://tools.ietf.org/html/rfc6455#page-6
    server,
});

ser.on("connection", (ws, req) => {
    //ser.clients
    // AA
    // BB
    // Update User
    // AA isOnline 1
    // BB isOnline 1

    // Nahi Aaya hai
    // CC isOnline 0

    //console.log('ser :', ser.clients.size);
    // Tab 1
    // Tab 2
    ws.on("message", (msg) => {
        const _d = JSON.parse(msg);
        //  console.log(msg);

        if (_d.type == "typing") {
            let sql2 =
                "update chat_user set isOnline='" + _d.data + "' where id=" + ws.userId;
            db.query(sql2).then((response) => {});

            return false;
        }

        if (_d.type == "ping") {
            clearTimeout(tm[ws.userId]);
            //  console.log(ws.userId), "fdgdf";
            tm[ws.userId] = setTimeout(function() {
                console.log("dsfsf");
                /// ---connection closed ///
                ws.close();
            }, 10000);

            if (_d.hasOwnProperty("ToChat")) {

                let sql2 =
                    "SELECT  *,DATE_FORMAT(created_date, '%Y/%m/%d %H:%i %p' ) AS LastSeen  FROM chat_user where isActive=1 and id='" +
                    _d.ToChat.id +
                    "'";
                db.query(sql2).then((response) => {


                    // console.log(response);
                    ws.send(
                        JSON.stringify({
                            data: response[0],
                            type: "toDetail",
                        })
                    );
                });



                let sql23 =
                    "Update  chat_details set msg_status=2 where to_id='" +
                    ws.userId +
                    "' and from_id='" +
                    _d.ToChat.id +
                    "'";
                db.query(sql23).then((response1) => {
                    if (response1[0]["changedRows"] > 0) {
                        //  console.log("fsfsdf");
                        ws.send(
                            JSON.stringify({
                                type: "updateChat",
                            })
                        );

                        for (c of ser.clients) {
                            if (c.userId == ws.userId && c.screenType == "Home") {
                                //    console.log(c.userId);
                                c.send(JSON.stringify({ type: "refresh" }));
                            }
                        }
                    }
                    //     let sql2 = "update chat_all_detail set unread=0,date_created='" + formatDate(new Date()) + "' where user_from_id='" + ws.userId + "' and user_to_id='" + _d.ToChat.id + "'";
                    //     db.query(sql2)
                    //         .then((response2) => {

                    //         });

                    // }

                    //    / console.log(sql23)
                });
            }

            if (_d.hasOwnProperty("getMsgList")) {
                // console.log(msg);
                let sql23 =
                    "Update  chat_details set msg_status=1 where to_id='" +
                    ws.userId +
                    "' and msg_status=0";
                db.query(sql23).then((response1) => {
                    if (response1[0]["changedRows"] > 0) {
                        ws.send(
                            JSON.stringify({
                                type: "refresh",
                            })
                        );
                    }
                });
            }

            return false;
        } else if (_d.type == "connect") {
            ws["userId"] = _d.data.id;
            ws["screenType"] = _d.data.screenType;


            if (_d.data.screenType == "Home") {
                let sql2 = "update chat_user set isOnline=1 where id=" + _d.data.id;
                db.query(sql2).then((response) => {
                    let sql23 =
                        "Update  chat_details set msg_status=1 where to_id='" +
                        ws.userId +
                        "' and msg_status=0";
                    db.query(sql23).then((response1) => {
                        if (response1[0]["changedRows"] > 0) {
                            ws.send(
                                JSON.stringify({
                                    type: "refresh",
                                })
                            );
                        }
                    });
                });
            }


            if (_d.data.screenType == "Chat") {
                let sql233 =
                    "update chat_user set isOnline=3 where id=" + ws.userId;
                db.query(sql233).then((response) => {

                });

                //  console.log()
                // for (c of ser.clients) {
                //     if ((c.userId == ws.userId || c.userId == _d.ToChat.id) && c.screenType == "Chat") {
                //         console.log(c.userId);
                //         c.send(JSON.stringify({ type: "updateChat" }));
                //     }
                // }
            }
            return false;
        }

        // console.log(_d);

        if (_d.type == "send_chat") {
            console.log("chat");

            let chat_details =
                "insert into  chat_details(from_id,to_id,chat_type_id,msg) values ('" +
                _d.from_id +
                "','" +
                _d.to_id +
                "','" +
                _d.chat_type_id +
                "','" +
                _d.msg +
                "')";
            db.query(chat_details).then((response) => {
                delete _d["type"];
                _d["chat_type_id"] = response[0].insertId;
                _d["creation_date"] = formatDateChat(new Date());
                _d["SentDate"] = formatDateChat(new Date());
                _d["MainDate"] = formatDateNewee(new Date());
                _d["msg_status"] = 0;

                let checkSql =
                    "select * from chat_all_detail where user_from_id='" +
                    _d.from_id +
                    "' and user_to_id= '" +
                    _d.to_id +
                    "'";

                let chat_details_new =
                    "insert into  chat_all_detail(user_from_id,user_to_id,date_created,lastMsg) values ('" +
                    _d.from_id +
                    "','" +
                    _d.to_id +
                    "','" +
                    formatDate(new Date()) +
                    "','" +
                    _d.msg +
                    "'),('" +
                    _d.to_id +
                    "','" +
                    _d.from_id +
                    "','" +
                    formatDate(new Date()) +
                    "','" +
                    _d.msg +
                    "')";
                let sql2 =
                    "update chat_user set isOnline='1' where id=" + ws.userId;
                db.query(sql2).then((response) => {});

                let update_table1 =
                    "update chat_all_detail set date_created='" +
                    formatDate(new Date()) +
                    "',lastMsg='" +
                    _d.msg +
                    "' where user_from_id='" +
                    _d.from_id +
                    "' and user_to_id='" +
                    _d.to_id +
                    "'";
                let update_table2 =
                    "update chat_all_detail set date_created='" +
                    formatDate(new Date()) +
                    "',lastMsg='" +
                    _d.msg +
                    "' where user_from_id='" +
                    _d.to_id +
                    "' and user_to_id='" +
                    _d.from_id +
                    "'";
                db.query(checkSql).then((response111) => {
                    if (response111[0].length == 0) {
                        db.query(chat_details_new).then((response11133) => {});
                    } else {
                        db.query(update_table1).then((response11133) => {});
                        db.query(update_table2).then((response11133) => {});
                    }

                    for (c of ser.clients) {
                        if (c.userId == _d.from_id || c.userId == _d.to_id) {
                            //    console.log(c.userId);
                            c.send(JSON.stringify({ type: "send_chat", data: _d }));
                        }
                    }
                });

                // let filters = ser.clients.filters(x => {
                //     return x.userId == ws.userId
                // });
                // console.log(filters.length, filters);
            });
        }

        // console.log(ws);
        // return false;

        //socket connection

        // console.log('msg :', msg);

        // SELECT isOnline from USer where name='CC'

        //CC isOnline -> 0

        //if CC -> 0
        // Send Notification
        //else if CC -> 1
        // Send c.send

        // ser.clients
        //send message to all
        // for (c of ser.clients) {
        //     c.send(JSON.stringify({
        //             name: ws.personName,
        //             data: _d.data
        //         }))
        //         //         // if(ws !== c){

        // }
        // }
    });

    ws.on("close", () => {
        --_total;
        console.log("I lost a connection " + _total, ws.userId);

        if (ws.screenType == "Home") {
            let sql2 =
                "update chat_user set isOnline=0,created_date='" +
                formatDate(new Date()) +
                "' where id=" +
                ws.userId;
            db.query(sql2).then((response) => {});
        }
    });

    console.log();

    ++_total;
    console.log("One more client connected " + _total);
});

function formatDateChat(date) {
    var d = new Date(date),
        month = "" + (d.getMonth() + 1),
        day = "" + d.getDate(),
        year = d.getFullYear();
    var hours = d.getHours();
    var minutes = d.getMinutes();
    var seconds = d.getSeconds();

    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;
    var check = hours > 11 ? "pm" : "am";
    var checkHous = hours > 11 ? 24 - hours : hours;
    var formatnew = [hours, minutes, seconds].join(":");
    var dateFor = [year, month, day].join("-");
    return checkHous + ":" + minutes + " " + check;
    minutes;
}

function remove_client() {
    tm = setTimeout(function() {}, 5000);
}

function formatDateNewee(date) {
    let month_array = [
        "Jan",
        "Feb",
        "Mar",
        "April",
        "May",
        "June",
        "July",
        "Aug",
        "Sept",
        "Oct",
        "Nov",
        "Dec",
    ];
    var d = new Date(date),
        month = "" + (d.getMonth() + 1),
        day = "" + d.getDate(),
        year = d.getFullYear();
    var hours = d.getHours();
    var minutes = d.getMinutes();
    var seconds = d.getSeconds();

    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;
    var formatnew = [hours, minutes, seconds].join(":");

    var countMonth = d.getMonth();
    var checkMon = month_array[countMonth];
    var dateFor = [year, checkMon, day].join("/");

    return dateFor;
}

function formatDate(date) {
    var d = new Date(date),
        month = "" + (d.getMonth() + 1),
        day = "" + d.getDate(),
        year = d.getFullYear();
    var hours = d.getHours();
    var minutes = d.getMinutes();
    var seconds = d.getSeconds();

    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;
    var formatnew = [hours, minutes, seconds].join(":");
    var dateFor = [year, month, day].join("-");

    return dateFor + " " + formatnew;
}
//app.listen(PORT, () => console.log(`Listening on ${PORT}`));