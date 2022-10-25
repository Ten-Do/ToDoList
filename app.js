const Sequelize = require('sequelize');
const Express = require('express');
const fs = require("fs");
let SQL = `SELECT * FROM Tasks`;  // здесь мы будем хранить крайний SQL запрос для использования его в качестве подзапроса
let search_value = ''

const app = Express();
app.set('viev engine', 'hbs');
const urlEncodedParser = Express.urlencoded({extended: false});

const db = new Sequelize("my_db", "TenD", "qwedcxzas13240", {
    dialect: "sqlite",
    host: "localhost",
});

db.authenticate()
.then(() => {
    console.log("authenticate: OK")
})
.catch(() => {
    console.log("authenticate: ERR")
});

const Tasks = db.define("Task", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    task_name: {
        type: Sequelize.STRING
    },
    task_description: {
        type: Sequelize.TEXT
    }
});
db.sync({forse: true}).then(() => {
    app.listen(3000, function(){
        console.log("Сервер запущен успешно");
        Tasks.create(
            {
                task_name: "17.10 Понедельник",
                task_description: "ООП лаба\nООП лекция"
            }
          )
          Tasks.create(
            {
                task_name: "18.10 Вторник",
                task_description: "Физ-ра\nЭкономика лекция\nТер.Вер. лекция"
            }
          )
          Tasks.create(
            {
                task_name: "19.10 Среда",
                task_description: "САОД лекция\nКомп. Граф. лекция\nСАОД лаба"
            }
          )
          Tasks.create(
            {
                task_name: "20.10 Четверг",
                task_description: "Военная кафедра жестьб....."
            }
          )
    })
    
})


app.get("/", (request, response) => {
    db.query(SQL, {
        raw: true,
        type: Sequelize.QueryTypes.SELECT
    })
    .then((data => {
        response.render("index.hbs", {
            tasks: data,
            srcVal: search_value
        })
    }))
    
});


app.get("/:order", (request, response) => {
    const order = request.params.order;
    db.query(`SELECT * FROM (${SQL}) ORDER BY ${order}`, {  // для того чтобы сортировать те данные которые были выбраны ранее (например при помощи функции поиска)
        raw: true,
        type: Sequelize.QueryTypes.SELECT
    })
    .then(data => {
        response.render("index.hbs", {
            tasks: data
        })
    })
    .catch((err) => console.log(err));
});


app.post("/create", urlEncodedParser, (request, response) => {
    Tasks.create(
        {
            task_name: request.body.task_name,
            task_description: request.body.task_description
        }
    ).then(() => {response.redirect("/");})
});


app.post("/edit", urlEncodedParser, (request, response) => {
    Tasks.update(
        {
            task_name: request.body.task_name,
            task_description: request.body.task_description
        },
        {
            where: {
                id: request.body.id
            }
        }
    )
    .then(() => {response.redirect("/");})
});


app.post("/delete", urlEncodedParser, (request, response) => {
    db.query(`DELETE FROM Tasks WHERE id=${request.body.id};`, {
        raw: true,
        type: Sequelize.QueryTypes.DELETE
    })
    .then(() => {response.redirect("/");})
});


app.post("/search", urlEncodedParser, (request, response) => {
    search_value = request.body.searchValue;
    if (search_value){
        let search = search_value.split('').map(elem => {
            if (elem.toLowerCase() != elem.toUpperCase()){
                return `[${elem.toLowerCase()}${elem.toUpperCase()}]`;
            }
            return elem;
        });
        SQL = `SELECT * FROM Tasks WHERE task_name || ' ' || task_description GLOB '*${search.join('*')}*'`;    
    }
    else SQL = `SELECT * FROM Tasks`;
    response.redirect("/");
});


app.post("/download", urlEncodedParser, (request, response) => {
    db.query(SQL, {
        raw: true,
        type: Sequelize.QueryTypes.SELECT
    }).then(data => {
        let text = '';
        for (elem of data){
            text += `\t${elem.task_name}\t->\n${elem.task_description}\n${elem.createdAt}\n====================================\n\n`
        }
        fs.writeFileSync(request.body.filename + '.txt', text);
    }).then(() => response.redirect("/"))
})
