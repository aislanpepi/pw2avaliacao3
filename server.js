import app from "./src/app.js";
import express from "express";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3200;

app.listen(PORT,
    ()=>{
        console.log("Server is listening!");
    }
)