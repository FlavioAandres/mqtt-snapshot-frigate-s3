require('dotenv').config();
const mqtt = require('mqtt');
const AWS = require('aws-sdk');
const { Readable } = require('stream');
const axios = require('axios');

const CAMERAS_LIST_TO_READ = ["sala","patio", "terraza", "aromaticas", "parqueadero"];
const LABELS_TO_FOLLOW = ["person", "car", "cat", "dog"];


// Configure AWS S3
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

// Connect to MQTT broker
const mqttClient = mqtt.connect(process.env.MQTT_BROKER_URL, {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
});

// Subscribe to the MQTT topic
const topic = process.env.MQTT_TOPIC;
mqttClient.on('connect', () => {
    console.log(`Connected to MQTT broker at ${process.env.MQTT_BROKER_URL}`);
    mqttClient.subscribe(topic, (err) => {
        if (err) {
            console.error(`Failed to subscribe to topic ${topic}:`, err);
        } else {
            console.log(`Subscribed to topic: ${topic}`);
        }
    });
});

mqttClient.on('error', (error) => {
    console.error('MQTT connection error:', error);
});


// Handle incoming messages
mqttClient.on('message', async (topic, message) => {
    try {
        const content = JSON.parse(message.toString());
        
        if(!content.before){
            console.log('No content found in the message.', JSON.stringify(content));
            return;
        }
        const {
            camera,
            id,
            label,
        } = content.before;
        
        if (!CAMERAS_LIST_TO_READ.includes(camera)) {
            console.log(`Camera ${camera} is not in the list of cameras to read.`);
            return;
        }
        
        if (!LABELS_TO_FOLLOW.includes(label)) {
            console.log(`Label ${label} is not in the list of labels to follow.`);
            return;
        }
        const date = new Date(); 
        const formatedDate = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
        const key = `homeassitant-test/${formatedDate}/${camera}/${label}/${Date.now()}.jpg`;
        const result = await axios.get(process.env.API_FRIGATE_URL + `/events/${id}`);
        const image = result.data.thumbnail;
        if (!image) {
            console.log(`No image found for event ID ${id}, on camera ${camera}.`);
            return;
        }

        const imageBuffer = Buffer.from(image, 'base64');
        const stream = new Readable();
        stream.push(imageBuffer);
        stream.push(null);
        const params = {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: key,
            Body: stream,
            ContentType: 'image/jpeg',
            ACL: 'public-read',
        };
        const uploadResult = await s3.upload(params).promise();
        console.log(`
        Camera: ${camera}, Event ID: ${id}, Label: ${label}
        Location: ${uploadResult.Location}
        Image uploaded successfully. 
        `);
    } catch (error) {
        console.error(`Error processing message or uploading to S3::`, error.message);
        if(process.env.DEBUG){
            console.error('Full error details:', error);
        }
    }
});