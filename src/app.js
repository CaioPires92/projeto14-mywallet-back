import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import { MongoClient } from 'mongodb'
import Joi from 'joi'
import bcrypt from 'bcrypt'

const app = express()

// configs
app.use(cors())
app.use(express.json())
dotenv.config()

// conexão DB
const mongoClient = new MongoClient(process.env.DATABASE_URL)

try {
  mongoClient.connect()
  console.log('MongoDB conectado!')
} catch (err) {
  console.log(err.message)
}
let db = mongoClient.db()

// Schema
const userSchema = Joi.object({
  nome: Joi.string().required(),
  email: Joi.string().email().required(),
  senha: Joi.string().min(3).required()
})

// endpoinst
app.post('/cadastro', async (req, res) => {
  const { nome, email, senha, confirmarSenha } = req.body

  if (senha !== confirmarSenha) {
    return res.status(400).send('As senhas não coincidem')
  }

  const validation = userSchema.validate(req.body, {
    abortEarly: false,
    allowUnknown: true
  })
  if (validation.error) {
    return res
      .status(422)
      .send(validation.error.details.map(detail => detail.message))
  }
  try {
    const user = await db.collection('users').findOne({ email })
    if (user) return res.status(409).send('usuario já cadastrado')

    const passwordHash = bcrypt.hashSync(senha, 10)
    await db.collection('users').insertOne({ nome, email, senha: passwordHash })
    res.sendStatus(201)
  } catch (err) {
    res.status(500).send(err.message)
  }
})

// app.get('/', (req, res) => {
//   res.send('Olá, mundo!')
// })

// app.post('/cadastro', (req, res) => {
//   db.collection('users').insertOne({
//     email: 'caio@caio',
//     password: '1234'
//   })
// })

// deixar a porta escutando, a espera de requisições
const port = 5000
app.listen(port, () => {
  console.log(`servidor rodando na porta ${port}`)
})
