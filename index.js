const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDb = require('./db/connectDb');
const router = require('./routes/handler');
const clientRoutes = require('./routes/clientRoute');
const taskerRoutes = require('./routes/taskRoute');
const processRefunds = require('./helpers/processRefunds');

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.use(cors({
    origin: "*"
}));


app.use("/api/v1/", router);
app.use("/api/v1/client", clientRoutes);
app.use("/api/v1/task", taskerRoutes);

app.get("/", (req, res) => {
    res.status(200).json({ info: "API working perfectly"})
});

const port = 3948;

app.listen(port, async() => {
    console.log(`server is working at port ${port}`);
    await connectDb();
    processRefunds();
})