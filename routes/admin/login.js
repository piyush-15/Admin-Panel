const express = require('express')
const router = express.Router();
const AWS = require('aws-sdk');

var dynamoDBConfiguration = {
    "accessKeyId": "piyush",
    "secretAccessKey": "piyush",
    "region": "ap-southeast-2"
};
// AWS.config.update({

//     region: 'ap-south-1'
// });

AWS.config.update(dynamoDBConfiguration);
var cfg = { "endpoint": new AWS.Endpoint("http://localhost:8000")};
AWS.config.update(cfg);
var dynamodb = new AWS.DynamoDB();
const config = {
    aws_table_name: 'admin-login',
    aws_local_config: {
      region: 'local',
      endpoint: 'http://localhost:8000'
    },
    aws_remote_config: {
    }
  };

// const dynamodb = new AWS.DynamoDB.DocumentClient();
const dynamodbTableName = 'admin-login';


router.get('/', async (req, res) => {
    console.log(req.query);
    // const params = {
    //     TableName: dynamodbTableName,
    //     Key: {
    //       email:
    //       {
    //           S: req.query.email
    //       }
    //     //   password:{
    //     //       S: req.query.password
    //     //   }
    //     }
    //   }
    var params = {
        TableName : dynamodbTableName,
        Key : { 
          "email" : {
            "S" : req.query.email
          }
        }
      }
    try {
        let response = await dynamodb.getItem(params).promise();
        let database_item = response.Item;
        //console.log("SUCCESSFULL GET", database_item);
       // console.log(response.Item.password.S);
        res.json(response);
     } catch(err) {
        console.log(err);
        console.error('Do your custom error handling here. I am just ganna log it out: ', err);
        res.status(500).send(err);
     }
  
})
  
router.get('/all', async (req, res) => {
    const params = {
        TableName: dynamodbTableName
    }
    try {
        const allLogins = await scanDynamoRecords(params, []);
        const body = {
            logins: allLogins
        }
        res.json(body);
    } catch(error) {
        console.error('Do your custom error handling here. I am just ganna log it out: ', error);
        res.status(500).send(error);
    }
})
// router.get('/all', (req, res)=> {
//     const params = {
//         TableName: dynamodbTableName
//     }
//     dynamodb.scan(params, function(err, data) {
//         if (err) {
//            console.log(err);
//         } else {
//           const { Items } = data;
//           console.log(Items);
//         }
//     });
// });

router.post('/', async (req, res) => {
    const params = {
      TableName: dynamodbTableName,
      Item: req.body
    }
    await dynamodb.putItem(params).promise().then(() => {
      const body = {
        Operation: 'SAVE',
        Message: 'SUCCESS',
        Item: req.body
      }
      res.json(body);
    }, error => {
      console.error('Do your custom error handling here. I am just ganna log it out: ', error);
      res.status(500).send(error);
    })
})

router.patch('/', async (req, res) => {
    const params = {
        TableName: dynamodbTableName,
        Key: {
        'email': req.body.email
        },
        UpdateExpression: `set ${req.body.updateKey} = :value`,
        ExpressionAttributeValues: {
        ':value': req.body.updateValue
        },
        ReturnValues: 'UPDATED_NEW'
    }
    await dynamodb.update(params).promise().then(response => {
        const body = {
        Operation: 'UPDATE',
        Message: 'SUCCESS',
        UpdatedAttributes: response
        }
        res.json(body);
    }, error => {
        console.error('Do your custom error handling here. I am just ganna log it out: ', error);
        res.status(500).send(error);
    })
})

router.delete('/', async (req, res) => {
    const params = {
        TableName: dynamodbTableName,
        Key: {
            'email': req.query.email
        },
        ReturnValues: 'ALL_OLD'
    }
    await dynamodb.delete(params).promise().then(response => {
        const body = {
            Operation: 'DELETE',
            Message: 'SUCCESS',
            Item: response
        }
        res.json(body);
    }, error => {
        console.error('Do your custom error handling here. I am just ganna log it out: ', error);
        res.status(500).send(error);
    })
})

async function scanDynamoRecords(scanParams, itemArray) {
    try {
        const dynamoData = await dynamodb.scan(scanParams).promise();
        itemArray = itemArray.concat(dynamoData.Items);
        if (dynamoData.LastEvaluatedKey) {
        scanParams.ExclusiveStartKey = dynamoData.LastEvaluatedKey;
        return await scanDynamoRecords(scanParams, itemArray);
        }
        return itemArray;
    } catch(error) {
        throw new Error(error);
    }
}

module.exports = router;