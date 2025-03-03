const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDb = require('./db/connectDb');
const router = require('./routes/handler');
const clientRoutes = require('./routes/clientRoute');
const taskerRoutes = require('./routes/taskRoute');
const chatRoutes = require('./routes/chatRoute');
const supportRoutes = require('./routes/supportRoute');
const userRoutes = require('./routes/userRoute');
const processRefunds = require('./helpers/processRefunds');
const { initializeSocket } = require('./utils/socket');



dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.use(cors({
    origin: "*"
}));


app.use("/api/v1/", router);
app.use("/api/v1/client", clientRoutes);
app.use("/api/v1/task", taskerRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/support", supportRoutes);
app.use("/api/v1/user", userRoutes);

initializeSocket(server);

app.get("/", (req, res) => {
    res.status(200).json({ info: "API working perfectly"})
});

const port = 3948;

app.listen(port, async() => {
    console.log(`server is working at port ${port}`);
    await connectDb();
    processRefunds();
})