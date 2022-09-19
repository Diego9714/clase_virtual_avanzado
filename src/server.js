require("dotenv").config()
require("./controllers/connect")()
const connection = conn()

const express       = require("express")
const app           = express()
const port          = process.env.PORT
const url           = process.env.URL
const ejs           = require("ejs")
const path          = require("path")
const parser        = require("body-parser")
const fetch         = require("node-fetch")
const bcrypt        = require("bcrypt")
const jwt           = require("jsonwebtoken")

app.set("views",path.join(__dirname , "../views"))
app.engine("ejs",ejs.__express)
app.set("view engine","ejs")
app.use(express.static(__dirname+"../views"))
app.use(parser.urlencoded({extended:true}))

app.listen(port,function(){
    connection.connect(function(){
        console.log(`Server running on ${url + port}`)
    })
})

app.get(process.env.ROOT_PATH ,(req,res)=>{
    res.render("register")
})

app.get(process.env.LOGIN_PATH ,(req,res)=>{
    res.render("login")
})

app.get(process.env.HASHV_PATH ,(req,res)=>{
    const {value} = req.params
    bcrypt.hash(value,10,(err,hash)=>{
        if(err)throw err
        res.send(hash)
    })
})

app.get(process.env.HASH_PATH ,(req,res)=>{
    const {value} = req.params
    bcrypt.compare(value, process.env.HASH ,(err,comp)=>{
        if(err)throw err
        res.send(comp)
    })
})

app.post("/add/user",(req,res)=>{
    const {email,password} = req.body
    bcrypt.hash(password,10,(err,hash)=>{
        const sql = `INSERT INTO usuarios (correo,password) values ("${email}","${hash}");`
        connection.query(sql,(err,data,fields)=>{
            if(err)throw err
            res.send("Usuario registrado")
        })
    })
})

app.post("/user/login",async(req,res)=>{
    const {email,password} = req.body
    const sql = `SELECT * FROM usuarios WHERE correo = "${email}";`

    const user = await new Promise((resolve,reject)=>{
        connection.query(sql,(err,data,fields)=>{
            bcrypt.compare(password,data[0].password,(err,comp)=>{
                if(err) reject(err)
                resolve(comp)
            })
        })
    })

    if(user){
        const payload = {
            correo : email,
            clave  : password,
            niv_acc : "Usuario"
        }
        jwt.sign(payload, process.env.KEY , {algorithm:"HS256" , expiresIn : 86400} , (err,token)=>{
            if(err) throw err

            const sql = `INSERT INTO login (correo,token) values ("${email}","${token}");`

            connection.query(sql,(err)=>{
                if(err)throw err
                res.send("Token registrado en la base de datos")
            })
        })
    }else{
        res.send("Hay un problema")
    }
})

// Asincronismo 
// Callbacks 
app.get("/asincronismo/callbacks",(req,res)=>{
    console.log("Primer mensaje")

    setTimeout(()=>{
        console.log("Segundo mensaje")
    },3000)

    console.log("Tercer mensaje")

    res.send("Hola mundo")
})

app.get("/asincronismo/promesas",(req,res)=>{
    // setTimeout(()=>{
    //     console.log("Primer callback")
    //     setTimeout(()=>{
    //         console.log("Segundo callback")
    //         setTimeout(()=>{
    //             console.log("Tercer callback")
    //         },8000)
    //     },5000)
    // },3000)

    // Usaremos random user para ver el comportamiento de la promesa
    fetch("https://randomuser.me/api")
    .then((datos)=>{
        return datos.json()
    })
    .then((data)=>{
        res.json(data)
    })
    .catch((err)=>{
        console.log(err)
    })
})

// Async - await
app.get("/asincronismo/asywait", async(req,res)=>{
    const resPromesa = await fetch("https://randomuser.me/api")
    const respuestaJson = await resPromesa.json()
    res.send(respuestaJson)
})

// Promesas desde su constructor
app.get("/buscar/usuario",async (req,res)=>{
    var sql = `SELECT * FROM usuarios WHERE correo = "diegoa.9714@gmail.com";`
    var correo = await new Promise ((resolve,reject)=>{
        connection.query(sql,(err,data,fields)=>{
            if(err) return reject(err)
            return resolve(data)
        })
    })
    res.render("login",{correo})
})

// Variables de entorno y jsonwebtoken

/*
    Jsonwebtoken: Es una forma de enviar datos de manera segura a traves de un token

    payload         = Informacion a encriptar
    privateKey      = Llave para desencriptar la informacion
    algoritmo       = Metodo de encriptacion
    function        = Devuelve 2 valores: err y token   
*/

app.get("/jwt/create/:user/:access",(req,res)=>{
    const {user,access} = req.params
    const payload = {
        usuario : user,
        acceso  : access
    }

    jwt.sign(payload , process.env.KEY , {algorithm:"HS256" , expiresIn: 86400} , (err,token)=>{
        if(err)throw err
        res.send(token)
    })

})

app.get("/jwt/verify/:key/:token",(req,res)=>{
    const {key,token} = req.params

    jwt.verify(token, key, (err,decoded)=>{
        if(err)throw err
        if(decoded.accesso = "adminstrador"){
            res.send("Bienvenido Administrador")
        }else{
            res.send("Hola usuario")
        }
    })
})