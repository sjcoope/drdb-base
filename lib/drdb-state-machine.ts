import * as cdk from "@aws-cdk/core"

import * as sfn from "@aws-cdk/aws-stepfunctions";
import * as tasks from "@aws-cdk/aws-stepfunctions-tasks";
import * as lambda from "@aws-cdk/aws-lambda";
import * as iam from "@aws-cdk/aws-iam"

/* 

TODO
- Error handling and retries in step functions.

*/

export class DRDBStateMachine extends cdk.Construct {
    public Machine: sfn.StateMachine;

    constructor(scope: cdk.Construct, id: string) {
        super(scope, id)

        // TODO: Fix this.
        const functionCheckEMRStatusRole = new iam.Role(this, 'CheckEMRStatusRole', {
            assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
            ]
        })

        functionCheckEMRStatusRole.addToPolicy(new iam.PolicyStatement({
            resources: ["*"],
            actions: ["elasticmapreduce:ListClusters"]
        }))

        const functionCheckEMRStatus = new lambda.Function(this, "DRDB-CheckEMRStatus", {
            runtime: lambda.Runtime.PYTHON_3_8,
            handler: "function.handler",
            code: lambda.Code.fromAsset("src/function-check-emr-status"),
            role: functionCheckEMRStatusRole
        })

        const jobFailed = new sfn.Fail(this, 'Job Failed', {
            cause: 'DRDB Job Processing State Job Failed'
        });

        // TODO: use tasks.EmrCreateCluster
        const emrCreateClusterTask = new sfn.Wait(this, "Create EMR Cluster", {
            time: sfn.WaitTime.duration(cdk.Duration.seconds(5))
        })

        const emrWaitForClusterTask = new sfn.Wait(this, "Wait for EMR Cluster", {
            time: sfn.WaitTime.duration(cdk.Duration.seconds(5))
        })

        const emrSubmitStep = new sfn.Wait(this, "Wait for EMR Cluster", {
            time: sfn.WaitTime.duration(cdk.Duration.seconds(5))
        })

        const definition = new tasks.LambdaInvoke(this, "Check EMR Cluster Status", {
            lambdaFunction: functionCheckEMRStatus,
            outputPath: "$.Payload"
        })
            .next(new sfn.Choice(this, 'EMR running?')
                .when(sfn.Condition.isNull("$.Payload"), emrCreateClusterTask)
                .when(sfn.Condition.stringEquals("$.status", "BOOTSTRAPPING"), emrWaitForClusterTask)
                .when(sfn.Condition.stringEquals("$.status", "WAITING"), emrSubmitStep)
                .otherwise(new sfn.Succeed(this, "Succeeded"))
            )
        
// .when(sfn.Condition.or(sfn.Condition.stringEquals("$.status", "STARTING"), sfn.Condition.stringEquals("$.status", "BOOTSTRAPPING"), emrWaitForClusterTask)

        this.Machine = new sfn.StateMachine(this, "DRDBStateMachine", {
            definition,
            timeout: cdk.Duration.minutes(5)
        })
    }
}