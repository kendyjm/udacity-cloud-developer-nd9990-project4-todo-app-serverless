import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient, DeleteItemOutput } from 'aws-sdk/clients/dynamodb'
import { TodoItem } from '../models/TodoItem'
import { createLogger } from '../utils/logger'

const logger = createLogger('todos-dao')

const XAWS = AWSXRay.captureAWS(AWS)

export class TodosDao {
    constructor(
        private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
        private readonly todosTable = process.env.TODOS_TABLE,
        private readonly createdAtIndex = process.env.TODOS_INDEX_CREATED_AT
    ) { }

    async getTodos(userId: string): Promise<TodoItem[]> {
        const result = await this.docClient
            .query({
                TableName: this.todosTable,
                IndexName: this.createdAtIndex,
                KeyConditionExpression: 'userId = :userId',
                ExpressionAttributeValues: {
                    ':userId': userId
                }
            })
            .promise()

        logger.info("Retrieved todo items", {userId, "count" : result.Count})

        const items = result.Items

        return items as TodoItem[]
    }

    async createTodo(newTodoItem: TodoItem): Promise<TodoItem> {
        const result = await this.docClient
            .put({
                TableName: this.todosTable,
                Item: newTodoItem
            })
            .promise()

        logger.info("Saved new todo item", {newTodoItem} )
        
        return newTodoItem
    }    

    async deleteTodo(todoId: string, userId: string) {
        const deleteItem:DeleteItemOutput = await this.docClient
            .delete({
                TableName: this.todosTable,
                Key: {todoId, userId},
                ReturnValues: "ALL_OLD"
            })
            .promise()

        const deletedTodo = deleteItem.Attributes

        logger.info("Deleted todo item", {deletedTodo})    
    }    
}