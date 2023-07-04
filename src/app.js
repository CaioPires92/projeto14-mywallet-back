import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import { MongoClient } from 'mongodb'
import Joi from 'joi'

// config
dotenv.config()
const app = express()
app.use(cors())
app.use(express.json())

const mongoClient = new MongoClient(process.env.BASE_URL)
let db

mongoClient
  .connect()
  .then(() => (db = mongoClient.db))
  .catch(err => console.log(err.message))

// variaveis
const port = 5000

app.get('/', (req, res) => {
  res.send('Olá, mundo!')
})

app.post('/cadastro', (req, res) => {
  db.collection('users').insertOne({
    email: 'caio@caio',
    password: '1234'
  })
})

app.listen(port, () => {
  console.log(`servidor rodando na porta ${port}`)
})
