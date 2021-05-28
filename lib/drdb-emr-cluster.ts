
import * as cdk from "@aws-cdk/core"
import * as emr from "@aws-cdk/aws-emr"
import * as iam from "@aws-cdk/aws-iam"
import * as ec2 from "@aws-cdk/aws-ec2"
import * as s3 from "@aws-cdk/aws-s3"

export class DRDBEMRCluster extends cdk.Construct {

    constructor(scope: cdk.Construct, id: string) {
        super(scope, id)

        // EMR Resources - VPC
        const vpcId = "vpc-c72f20a0"
        const vpc = ec2.Vpc.fromLookup(this, "VPC", {
            vpcId: vpcId
        })
        const subnetId = "subnet-3e5abb76"

        // EMR Resources - Security Group
        const sg = new ec2.SecurityGroup(this, 'SecurityGroup', {
            vpc: vpc,
        });

        // EMR Resources - FlowRole
        const role = new iam.Role(this, 'DRDBFlowRoles', {
            assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonElasticMapReduceforEC2Role')
            ]
        });

        const profile = new iam.CfnInstanceProfile(this, 'InstanceProfile', {
            roles: [ role.roleName ]
        });

        // EMR Resources - EC2-Key-Pair
        const keypairName = "sjc-kp"

        // EMR Resources - S3 Script Bucket
        const scriptBucket = new s3.Bucket(this, "DRDB-EMR-ScriptBucket")
        scriptBucket.grantRead(role)

        // EMR Resources - S3 Log Bucket
        const logBucket = new s3.Bucket(this, "DRDB-EMR-LogBucket")
        logBucket.grantReadWrite(role)

        // Create cluster
        const cluster = new emr.CfnCluster(this, "DRDBEMRCluster", {
            name: this.node.tryGetContext("EMRClusterName"),
            releaseLabel: "emr-6.2.0",
            logUri: logBucket.s3UrlForObject(),
            applications: [
                { name: "Spark"},
                { name: "Hive" },
            ],
            instances: {
                masterInstanceGroup: {
                    instanceCount: 1,
                    instanceType: "r6g.xlarge",
                    name: "Master"
                },
                ec2KeyName: keypairName,
                additionalMasterSecurityGroups: [
                    sg.securityGroupName
                ],
                ec2SubnetId: subnetId
            },
            jobFlowRole: profile.ref,
            serviceRole: "EMR_DefaultRole",
            visibleToAllUsers: true
        })

        return cluster
    }
}
