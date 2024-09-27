const fs = require("fs")
const mysql = require("mysql2")
const { isArray } = require("util")
const convert = require("xml-js")
var readlineSync = require('readline-sync')

const file = fs.readFileSync(process.argv[2])

const doc = convert.xml2js(file.toString(), { compact: true })

let tables = doc.article.informaltable

if(!isArray(tables))
  tables = [tables]

if (!tables)
  console.log("No tables found")

let host = readlineSync.question("Host name: ")
let port = readlineSync.question("Port: ")
let user = readlineSync.question("User name: ")
let db   = readlineSync.question("DB name: ")
let pass;
if (readlineSync.keyInYN("Have a pass?"))
  pass = readlineSync.questionNewPassword("DB pass: ", { min: 1 } )
else
  pass = ""

const connection = mysql.createPool({
  host: host,
  user: user,
  database: db,
  password: pass,
  port: port
})

for (const table of tables) {
  let table_name = readlineSync.question("Table name: ")
  const tg = table.tgroup
  let cols = ""
  const cols_c = tg._attributes.cols
  const row_c = tg.tbody.row.length
  let colsobj = []
  for (let i = 0; i < cols_c; i++) {
    const name = tg.tbody.row[0].entry[i].para._text
    const colname = readlineSync.question(`COL ${name}: `)
    cols += colname
    colsobj.push(colname.split(' ')[0])
    if (i < cols_c - 1)
      cols += ','
  }
  while (readlineSync.keyInYN("Add an extra column?")) {
    cols += ','
    cols += readlineSync.question(`COL : `)
  }
  let sqlcreate = `CREATE TABLE IF NOT EXISTS ${table_name}
  (${cols});`
  console.log(sqlcreate)
  connection.query(sqlcreate, (err, result) => {
    if (err)
      console.log(err)
    console.log(result)
  })

  let values = ""
  for (let i = 1; i < row_c; i++) {
    values += '('
    for (let j = 0; j < cols_c; j++) {
      const value = tg.tbody.row[i].entry[j].para._text
      values += `'${value}'`
      if (j < cols_c - 1)
        values += ','
    }
    values += ')'
    if (i < row_c - 1)
      values += ','
  }
  sqlinsert = `INSERT ${table_name}(${colsobj.join(", ")})
  VALUES ${values};`
  console.log(sqlinsert)
  connection.query(sqlinsert, (err, result) => {
    if (err)
      console.log(err)
    console.log(result)
  })
}
