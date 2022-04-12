
// Module Imports and Constants
const express = require("express");
const { MongoClient, ServerApiVer, MongoClientsion } = require("mongodb");
const bodyparser = require("body-parser");


const PORT=8000;

const getStatus = (task) => {
  return task.isComplete ? 'Complete' : 'In Progress';
}

const firstLoaded = (collection, response) => {
  return collection.find().toArray()
    .then(tasks => {
    response.render('index.ejs', {
      tasks: tasks,
      getStatus: getStatus
    });
    })
    .catch(e => console.error(e));
}

// Note if the console outputs a "Error: connection <monitor> to 15.184.108.123:27017 closed"
// Please check https://stackoverflow.com/questions/60431996/mongooseerror-mongooseserverselectionerror-connection-monitor-to-52-6-250-2
const uri ='mongodb+srv://JadAwky:Jad12345@cluster0.ngj9b.mongodb.net/Database?retryWrites=true&w=majority'
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
  });
client.connect((err) => {
    if (err) {
      console.log("Error: " + err.errmsg);
    } else {
      console.log("Connection to database working.");
    }
    client.close();
  });

//Initialize express and add Middlewares
const app = express();
app.set("view engine", "ejs");
app.use(bodyparser.urlencoded({ extended: true }));
app.use(bodyparser.json());


//*************Routing APIs*****************//
// Every api will have a method (get,post,put,delete,...)
// Every api will hold a request & a response
// The URL parameter specifies 
// Use the request parameter (req) to parse and handle client's input data
// Use the response paramete (res) to parse/render the resulting output to the client 
// the returned response can be an HTML page or a JSON object
MongoClient.connect(connectionString)
  .then(client => {
    console.log('Connected Successfully!');
    const db = client.db();
    const tasksCollection = db.collection('tasks');
    app.get('/', async (req, res) => {
      return firstLoaded(tasksCollection, res);
    })
    app.get('/task', async (req, res) => {
      firstLoaded(tasksCollection, res);
    })
    app.post('/task', async (req, res) => {
      req.body['isComplete'] = false;
      tasksCollection.insertOne(req.body).then(() => firstLoaded(tasksCollection, res));
    })
    app.put('/task/toggle/:id', async (req, res) => {
      const id = new ObjectId(req.params.id.trim());
      return tasksCollection.find({ _id: id }).toArray().then(async (tasks) => {
        if (tasks.length > 0) {
          const task = tasks[0];
          return tasksCollection.updateOne({ _id: id }, { '$set': { isComplete: !task.isComplete } })
            .then((result) => {
              return firstLoaded(tasksCollection, res);
            })
        }
      })
    })
    app.delete(`/task/:id`, async (req, res) => {
      const id = ObjectId(req.params.id.trim());
      return await tasksCollection.deleteOne({ _id: id })
        .then(result => {
          if (result.deletedCount === 0) {
            res.send('Task not found')
          } else {
            firstLoaded(tasksCollection, res)
          }
        }).catch(e => console.error(e))
    })
  })