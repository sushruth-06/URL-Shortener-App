require('dotenv').config()

const express = require('express')
const app = express()
const mongoose = require('mongoose')
const DATABASE_URL = 'mongodb+srv://sushruthkonapur:Sushruth123@cluster0.spa3kgq.mongodb.net/?retryWrites=true&w=majority'
mongoose.connect(DATABASE_URL, { useNewUrlParser: true })
const db = mongoose.connection
db.on('error', (error) => console.error(error))
db.once('open', () => console.log('Connected to Database'))

app.use(express.json())

const urlsRoute = require('./routes/urls')
app.use('/urls', urlsRoute)

app.listen(3000, () => console.log('Server Started'))