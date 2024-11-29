import express from "express";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();

app.use(express.json());

const alunos = [];

app.post('/register', async(req,res) => {
    const {username,password} = req.body;

    const hashedPassword = await bcrypt.hash(password,10);

    alunos.push({username, password: hashedPassword});
    console.log(alunos);

    res.status(201).send("Aluno registrado!");
});

app.post('/login',async(req,res) => {
    const{username,password} = req.body;

    const aluno = alunos.find(aluno => aluno.username === username);

    if(!aluno || !(await bcrypt.compare(password, aluno.password))){
        return res.status(401).send("Login incorreto!");
    }

    const token = jwt.sign(
        {username: aluno.username},
        process.env.JWT_SECRET,
        {expiresIn: '1h', algorithm: 'HS256'}
    )

    res.json(token);
    console.log("Login efetuado pelo usuario " + aluno.username);
});

const authenticateJWT = (req,res,next) => {
    const authHeader = req.header('Authorization');
    console.log('Authorization' + authHeader);

    let token;

    if(authHeader){
        const parts = authHeader.split(' ');
        if(parts.length === 2){
            token = parts[1];
        }
    }

    if(!token){
        return res.status(401).send('Acesso Negado. Token não fornecido.');
    }

    jwt.verify(token,process.env.JWT_SECRET, (err,aluno) => {
        if(err){
            if(err.name === 'TokenExpiredError'){
                return res.status(401).send('Acesso negado. Token expirado.');
            } else if(err.name === 'JsonWebTokenError'){
                return res.status(403).send('Acesso negado. Token Invalido.');
            } else {
                return res.status(403).send('Acesso negado. Erro na verificação do token.');
            }
        }

        req.aluno = aluno;

        const issuedAtISO = new Date(aluno.iat * 1000).toISOString();
        const expiresAtISO = new Date(aluno.exp * 1000).toISOString();

        console.log(`Token validado para usuario: ${aluno.username}`);

        next();
    });
}

app.use(authenticateJWT);

app.get('')

export default app;