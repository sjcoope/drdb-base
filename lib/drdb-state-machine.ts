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

        const failed = new sfn.Fail(this, 'Job Failed', {
            cause: 'DRDB Job Processing State Job Failed'
        });

        const succeeded = new sfn.Succeed(this, "Succeeded")

        // TODO: use tasks.EmrCreateCluster
        const emrCreateClusterTask = new sfn.Wait(this, "Create EMR Cluster", {
            time: sfn.WaitTime.duration(cdk.Duration.seconds(5))
        })

        const emrWaitForClusterReadyTask = new sfn.Wait(this, "Wait for EMR Cluster", {
            time: sfn.WaitTime.duration(cdk.Duration.seconds(5))
        })

        const emrSubmitSparkJob = new sfn.Wait(this, "Submit Data Processing Job", {
            time: sfn.WaitTime.duration(cdk.Duration.seconds(5))
        })

        const emrStatusIsBootstrapping = sfn.Condition.stringEqualsJsonPath("$.Status", "BOOTSTRAPPING")
        const emrStatusIsStarting = sfn.Condition.stringEqualsJsonPath("$.Status", "STARTING")

        const definition = new tasks.LambdaInvoke(this, "Check EMR Cluster Status", {
            lambdaFunction: functionCheckEMRStatus,
            outputPath: "$.Payload"
        })

        // TODO = Work on updating step function schema
        // const definition = new tasks.LambdaInvoke(this, "Check EMR Cluster Status", {
        //     lambdaFunction: functionCheckEMRStatus,
        //     outputPath: "$.Payload"
        // })
        //     .next(new sfn.Choice(this, 'Is the EMR Cluster ready?')
        //         .when(sfn.Condition.isNull("$.Payload"), 
        //             emrCreateClusterTask.next(
        //                 emrWaitForClusterReadyTask
        //             )
        //             .next(emrSubmitSparkJob)
        //             .next(succeeded))
        //         .when(sfn.Condition.or(emrStatusIsBootstrapping, emrStatusIsStarting), 
        //             emrWaitForClusterReadyTask)
        //     )
            
        this.Machine = new sfn.StateMachine(this, "DRDBStateMachine", {
            definition,
            timeout: cdk.Duration.minutes(10)
        })
    }
}