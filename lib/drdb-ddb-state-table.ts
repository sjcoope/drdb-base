import * as cdk from "@aws-cdk/core"
import * as ddb from "@aws-cdk/aws-dynamodb"

export class DRDBDdbStateTable extends cdk.Construct {

    constructor(scope: cdk.Construct, id: string) {
        super(scope, id)

        const table = new ddb.Table(this, this.node.tryGetContext("DDBStateTableName"), {
            partitionKey: { name: "pk", type: ddb.AttributeType.STRING },
            sortKey: { name: "sk", type: ddb.AttributeType.STRING},
            billingMode: ddb.BillingMode.PAY_PER_REQUEST
        })

        table.addGlobalSecondaryIndex({
            indexName: "gsi_1",
            partitionKey: { name: "sk", type: ddb.AttributeType.STRING },
            sortKey: { name: "data", type: ddb.AttributeType.STRING }
        })
    }
}