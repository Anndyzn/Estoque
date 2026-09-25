const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const db = require("./banco");
const gondolasRoutes = require("./routes/gondolasRoutes");
const materiaisRoutes = require("./routes/materiaisRoutes");
const estoqueRoutes = require("./routes/estoqueRoutes");


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

app.set("io", io);

app.use(cors());
app.use(express.json());
app.use(express.static("views"));
app.use(gondolasRoutes);
app.use(materiaisRoutes);
app.use(estoqueRoutes);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/estoque.html");
});

io.on("connection", (socket) => {
  console.log(`Cliente conectado em tempo real: ${socket.id}`);
});

server.listen(4000, "0.0.0.0", () => {
  console.log("Servidor rodando em http://localhost:4000");
});
