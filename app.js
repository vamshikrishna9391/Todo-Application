const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "./todoApplication.db");
let db = null;

const installDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3003, () => {
      console.log("Server Running At Port: 3003");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};

installDBAndServer();

// To create Table

app.get("/", async (request, response) => {
  const creatingTableQuery = `
    CREATE TABLE todo(
        id INTEGER,
        todo TEXT,
        priority text,
        status text
    )
    `;

  await db.run(creatingTableQuery);
  response.send("Table Created");
});

const hasStatus = (a) => a.status !== undefined;

const hasPriority = (a) => a.priority !== undefined;

const hasPriorityAndStatus = (a) =>
  a.priority !== undefined && a.status !== undefined;

// API 1. GET A List of Items WITH status

app.get("/todos/", async (request, response) => {
  const { status, priority, search_q = "" } = request.query;
  let getQuery = null;

  switch (true) {
    case hasPriority(request.query):
      getQuery = `
        SELECT 
            *
        FROM 
            todo
        WHERE 
            priority = '${priority}'
            `;
      break;
    case hasStatus(request.query):
      getQuery = `
        SELECT 
            *
        FROM 
            todo
        WHERE 
            status = '${status}'
        `;
      break;
    case hasPriorityAndStatus(request.query):
      getQuery = `
        SELECT 
            *
        FROM 
            todo
        WHERE 
            status = '${status}' AND
            priority = '${priority}'
    
              `;
      break;
    default:
      getQuery = `
        SELECT 
            *
        FROM 
            todo
        WHERE 
            todo LIKE '%${search_q}%';
        `;
  }

  const dbArr = await db.all(getQuery);
  response.send(dbArr);
});

// API 2. GET a todo item

app.get("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT 
        * 
    FROM 
        todo
    WHERE 
        id = ${todoId};
    `;

  const dbResponse = await db.get(getTodoQuery);
  response.send(dbResponse);
});

// API 3. POST a todo item

app.post("/todos/", async (request, response) => {
  const bodyDetails = request.body;
  const { id, todo, priority, status } = bodyDetails;
  const postTodoQuery = `
    INSERT INTO todo (id, todo, priority, status)
    VALUES(
        ${id},
        '${todo}',
        '${priority}',
        '${status}'
        )
    `;
  await db.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

// API 4. PUT a todo

app.put("/todos/:todoId/", async (request, response) => {
  let message = "";
  const bodyDetails = request.body;
  const { todoId } = request.params;

  const getQuery = `SELECT * FROM todo WHERE id = ${todoId}`;
  const pastTodo = await db.get(getQuery);

  const {
    todo = pastTodo.todo,
    priority = pastTodo.priority,
    status = pastTodo.status,
  } = bodyDetails;
  const putTodoQuery = `
    UPDATE 
        todo
    SET 
        todo = '${todo}',
        status = '${status}',
        priority = '${priority}'
    WHERE 
        id = ${todoId};
  `;

  await db.run(putTodoQuery);

  console.log(Object.keys(bodyDetails)[0]);
  switch (Object.keys(bodyDetails)[0]) {
    case "status":
      response.send("Status Updated");
      break;
    case "priority":
      response.send("Priority Updated");
      break;
    default:
      response.send("Todo Updated");
  }

});

// API 5. DELETE a Todo

app.delete("/todos/:todoId/",async (request, response) => {
    const {todoId} = request.params;
    const deleteTodoQuery = `
        DELETE FROM todo WHERE id = ${todoId}
     `
    await db.run(deleteTodoQuery)
     response.send("Todo Deleted")
})

module.exports = app;