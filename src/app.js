import express from "express";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();

app.use(express.json());

const alunos = [
    {
        "id": 1,
        "nome": "Aislan Pepi Rodrigues",
        "ra": "SC3038939",
        "nota1": 9,
        "nota2": 10
      },
      {
        "id": 2,
        "nome": "Ariel Pepi Rodrigues",
        "ra": "SC3948923",
        "nota1": 3.6,
        "nota2": 7
      }
];

const users = [];

app.post('/register', async(req,res) => {
    const {username,password} = req.body;
    const hashedPassword = await bcrypt.hash(password,10);

    users.push({username, password: hashedPassword});
    res.status(201).send("Usuario registrado!");
});

app.post('/login',async(req,res) => {
    const{username,password} = req.body;

    const user = users.find(user => user.username === username);

    if(!user || !(await bcrypt.compare(password, user.password))){
        return res.status(401).json({"message": "Login incorreto!"});
    }

    const token = jwt.sign(
        {username: user.username},
        process.env.JWT_SECRET,
        {expiresIn: '1h', algorithm: 'HS256'}
    )

    res.json({"message": "Login efetuado pelo usuario " + user.username,"jwt": token});
});

const authenticateJWT = (req,res,next) => {
    const authHeader = req.header('Authorization');
    let token;

    if(authHeader){
        const parts = authHeader.split(' ');
        if(parts.length === 2){
            token = parts[1];
        }
    }

    if(!token){
        return res.status(401).json({"message": "Acesso Negado. Token não fornecido."});
    }

    jwt.verify(token,process.env.JWT_SECRET, (err,user) => {
        if(err){
            if(err.name === 'TokenExpiredError'){
                return res.status(401).json({"message": "Acesso negado. Token expirado."});
            } else if(err.name === 'JsonWebTokenError'){
                return res.status(403).json({"message": "Acesso negado. Token Invalido."});
            } else {
                return res.status(403).json({"message": "Acesso negado. Erro na verificação do token."});
            }
        }

        req.user = user;

        const issuedAtISO = new Date(user.iat * 1000).toISOString();
        const expiresAtISO = new Date(user.exp * 1000).toISOString();

        next();
    });
}

app.use(authenticateJWT);

app.get('/alunos', (req,res) => {
    res.status(200).send(alunos);
});

app.post('/alunos', (req,res) => {
    const {id,nome,ra,nota1,nota2} = req.body;
    if(!alunos.some(aluno => aluno.ra === ra)){
        alunos.push({id, nome, ra, nota1, nota2});
        res.status(201).json({"message": "Aluno registrado!"});
    } else {
        res.status(401).json({"message": "Aluno com o RA informado já está registrado!"});
    }
});

app.get('/alunos/medias', (req,res) => {
    const medias = alunos.map(aluno => ({nome: aluno.nome,media: (aluno.nota1 + aluno.nota2)/2}));
    res.status(200).send(medias);
});

app.get('/alunos/aprovados', (req,res) => {
    const aprovados = alunos.map(aluno => ({nome: aluno.nome,status: (aluno.nota1 + aluno.nota2)/2 >= 6 ? "aprovado" : "repovado"}));
    res.status(200).send(aprovados);
});

app.get('/alunos/:id', (req,res) => {
    const chooseId = Number(req.params.id);
    const index = buscaAluno(req.params.id);
    if(!alunos.some(aluno => aluno.id === chooseId)){
        return res.status(404).json({"message":"Aluno não encontrado!"});
    }
    return res.status(200).json(alunos[index]);
});

app.put('/alunos/:id', (req,res) => {
    const {nome,ra,nota1,nota2} = req.body;
    const index = buscaAluno(req.params.id);
    const aluno = alunos[index];
    aluno.nome = nome;
    aluno.ra = ra;
    aluno.nota1 = nota1;
    aluno.nota2 = nota2;
    res.status(200).json(alunos[index]);
});

app.delete('/alunos/:id', (req,res) => {
    const chooseId = Number(req.params.id);
    const alunoEscolhido = alunos.find(aluno => aluno.id === chooseId);
    if(!alunos.some(aluno => aluno.id === chooseId)){
        return res.status(404).json({"message":"Aluno não encontrado!"});
    }
    const index = alunos.indexOf(alunoEscolhido);
    alunos.splice(index,1);
    return res.status(200).json({"message": "Aluno deletado com sucesso!"});
});

function buscaAluno(id){
    return alunos.findIndex(aluno => {
        return aluno.id === Number(id);
    });
}

export default app;