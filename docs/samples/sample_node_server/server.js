var redis = require('redis');
const express = require('express');
const app = express();
app.use(
    express.urlencoded({
        extended: true,
    })
);

app.use(express.json());

app.post('/api/hook', (req, res) => {
    console.log('request headers:', req.headers);
    console.log('request body:', req.body);
    let data = {
        state_name: ''
    };
    if (req.body['state_name'] === 'enter_info') {
        data.state_name = 'process_data';
    } else {
        data.state_name = 'finish';
    }
    console.log('response after 5s...');
    setTimeout(() => {
        res.json(data);
    }, 5000);
});

app.put('/api/event', (req, res) => {
    // console.log('request event headers:', req.headers);
    console.log('request event body:', req.body);
});

app.listen(5000);

console.log('Node.js web server at port 5000 is running..');



const client = redis.createClient();

client.on('error', (err) => console.log('Redis Client Error', err));

client.connect().then(async () => {
    await client.subscribe('app_channel', (message) => {
        message = JSON.parse(message)
        console.log(message); // 'message'
        setTimeout(async () => {
            let data;
            if (message['state_name'] === 'enter_info') {
                data = 'process_data';
            } else {
                data = 'finish';
            }
            // let data =JSON.stringify({

            // })
            let client1 = client.duplicate();
            await client1.connect();
            client1.publish('app_channel_resp', data);
            console.log('publish response after 5s');
        }, 5000);
    });


    await client.subscribe('event_channel', (message) => {
        console.log('event:', message); // 'message'
    });
});