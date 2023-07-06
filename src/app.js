import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import { MongoClient } from 'mongodb'
import Joi from 'joi'
import bcrypt from 'bcrypt'
import { v4 as uuid } from 'uuid'

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

const loginSchema = Joi.object({
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

app.post('/', async (req, res) => {
  const { email, senha } = req.body

  const validation = loginSchema.validate(req.body, { abortEarly: false })

  if (validation.error) {
    return res
      .status(422)
      .send(validation.error.details.map(detail => detail.message))
  }

  try {
    const user = await db.collection('users').findOne({ email })
    if (!user) {
      return res.status(404).send('usuario não encontrado')
    }

    if (user && bcrypt.compareSync(senha, user.senha)) {
      const token = uuid()

      await db.collection('sessions').insertOne({ userId: user._id, token })
      res.send(token).status(200)
    } else {
      res.status(404).send('email ou senha incorretos')
    }
  } catch (err) {
    res.status(422).send(err.message)
  }
})

// deixar a porta escutando, a espera de requisições
const port = 5000
app.listen(port, () => {
  console.log(`servidor rodando na porta ${port}`)
})
