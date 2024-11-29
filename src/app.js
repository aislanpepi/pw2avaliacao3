import express from "express";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(express.json());

const alunos = [];

app.post('/register', async(req,res) => {
    const {username,password} = req.body;

    const hashedPassword = await bcrypt.hash(password,10);

    alunos.push({username, password: hashedPassword});
    console.log(alunos);

    res.status(200).send("Aluno registrado!");
});

export default app;