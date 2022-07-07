const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const port = 3000;
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../client'))
app.use(express.urlencoded());

class Block {
    constructor (index, timestamp, data, old_hash) {
        this.index = index;
        this.timestamp = timestamp; // Math.round(new Date().getTime()/1000)
        this.data = data;
        this.old_hash = old_hash;
        this.generate_hash();
    }
    generate_hash () {
        const header_string = `${this.index}${this.prev_hash}${this.data}${this.timestamp}`;
        this.hash = crypto.createHash('sha1').update(header_string).digest('hex');
    }
    jsn() {
        return {'index': this.index, 'timestamp': this.timestamp, 'data': this.data, 'hash': this.hash, 'old_hash': this.old_hash}
    }
    close() {
        const chain_dir = path.join(__dirname, 'chain');
        const strJSON = `{"index": ${this.index}, "timestamp": ${this.timestamp}, "data": "${this.data}", "hash": "${this.hash}", "old_hash": "${this.old_hash}"}`
        fs.writeFile(`${chain_dir}/${this.index}.json`, strJSON, err => { if (err) throw err; });
    }
}

function randomData(len) {
    var data = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for(var i = 0; i < len; ++i) {
        data += characters[Math.floor(Math.random() * characters.length)];
    }
    return data
}

function start_chain() {
    chain_dir = path.join(__dirname, 'chain');
    fs.readdir(chain_dir, (err, files) => {
        if (err) throw err;
        for (const file of files) {
          fs.unlink(path.join(chain_dir, file), err => { if (err) throw err; });
        }
    });

    const index = 0;
    const timestamp = Math.round(new Date().getTime()/1000);
    const data = 'Hello World!'; // randomData(10);
    const old_hash = null;

    const firstBlock = new Block(index, timestamp, data, old_hash);
    // const firstBlockJSON = firstBlock.jsn();
    // fs.writeFile(`${chain_dir}/${index}.json`, firstBlockJSON, err => { if (err) throw err; });
    firstBlock.close()
}


// Render Last Block
app.get('/', (req, res) => {
    chain_dir = path.join(__dirname, 'chain');
    fs.readdir(chain_dir, (err, files) => {
        if (err) throw err;
        fs.readFile(`${chain_dir}/${files[files.length-1]}`, 'utf-8', (err, data) => {
            if (err) throw err;
            res.render('index', {"transactionValue":false, "lastBlock":data});
        });
    });
    // res.render('index', {"transactionValue":false, "lastBlock":"WIP"});
});


// Save New Transaction
app.post('/', (req, res) => {
    const chain_dir = path.join(__dirname, 'chain');
    fs.readdir(chain_dir, (err, files) => {
        if (err) throw err;
        lastFileName = files[files.length-1];
        fs.readFile(`${chain_dir}/${lastFileName}`, 'utf-8', (err, data) => {
            const transactionData = req.body.transaction;
            const lastBlockHash = JSON.parse(data)['hash'];
            const lastBlockIndex = parseInt(lastFileName.slice(0, lastFileName.length-5), 10);
            const timestamp = Math.round(new Date().getTime()/1000);
            const newBlock = new Block(lastBlockIndex+1, timestamp, transactionData, lastBlockHash);
            console.log(newBlock);
            newBlock.close();
            res.render('index', {"transactionValue":req.body.transaction, "lastBlock":"WIP"});
        });
    });
});


// Render Whole Chain
app.get('/all', (req, res) => {
    res.render('all', {"transactions":'WIP'});
});

const server = app.listen(port, () => {
    console.log(`App mount http://localhost:${port}`);
});
