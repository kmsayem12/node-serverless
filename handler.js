const express = require("express");
const serverless = require("serverless-http");
const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk");

const app = express();
const dynamo = new AWS.DynamoDB.DocumentClient();
const TABLE = process.env.TODO_TABLE;

app.use(express.json());

// 🔸 Create Todo
app.post("/todos", async (req, res) => {
  const { title } = req.body;
  const item = { id: uuidv4(), title, completed: false };

  try {
    await dynamo.put({ TableName: TABLE, Item: item }).promise();
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: "Could not create todo", details: err });
  }
});

// 🔸 Get Todo by ID
app.get("/todos/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await dynamo
      .get({ TableName: TABLE, Key: { id } })
      .promise();
    if (!result.Item) {
      return res.status(404).json({ error: "Todo not found" });
    }
    res.json(result.Item);
  } catch (err) {
    res.status(500).json({ error: "Could not retrieve todo", details: err });
  }
});

// 🔸 Update Todo
app.put("/todos/:id", async (req, res) => {
  const { id } = req.params;
  const { title, completed } = req.body;

  const params = {
    TableName: TABLE,
    Key: { id },
    UpdateExpression: "set title = :title, completed = :completed",
    ExpressionAttributeValues: {
      ":title": title,
      ":completed": completed,
    },
    ReturnValues: "ALL_NEW",
  };

  try {
    const result = await dynamo.update(params).promise();
    res.json(result.Attributes);
  } catch (err) {
    res.status(500).json({ error: "Could not update todo", details: err });
  }
});

// 🔸 Delete Todo
app.delete("/todos/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await dynamo.delete({ TableName: TABLE, Key: { id } }).promise();
    res.json({ message: "Todo deleted" });
  } catch (err) {
    res.status(500).json({ error: "Could not delete todo", details: err });
  }
});

// 🔸 404 for unmatched routes
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// Export handler for Lambda
module.exports.handler = serverless(app);
