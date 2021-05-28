# DRDB Base Project
A project that contains the base infrastructure and services required for a test AWS driven database service.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template

## Steps in the process
1. S3 Events - Configure S3 events to trigger step functions (or trigger lambda to trigger step functions) - TODO
2. Step Functions - Steps functions will check the status of the EMR cluster and either create a new one or use the one that's active ("WAITING"), and add a "step" (i.e. Spark Job)
3. DynamoDB - Log operations from step functions in Dynamo.
4. Spark Job - Step functions will trigger spark job to handle file processing and output (into the "processed" folder)

## Jobs to be done

**General**
* EMR Monitor - need to create a job that terminates and creates a new EMR cluster on a certain schedule. 
* S3 Events - Connect DRFS drive s3 bucket to lambda for S3 events to trigger lambda and/or step functions (not tested if S3 events can trigger Step Functions or if we need a lambda before the SF).
* Spark Job Payload - In the payload for the spark job we have to specify the file type, delimiter and if the file has a header or not. This has to be detected from somewhere but for V0.2 maybe we could just restrict to CSV with a header and comma delimited (needs product confirmation). We can then figure out how to detect these variables in future releases.

**drdb-emr-cluster.ts**
* Instance - EBS Config - Should be specific on the ebs config for the instances. 
* EC2 KeyPair - should be a way to specify this in the CDK but at present there isn't because you need to download any newly create KP. Other ways to store in SecretsManager after creation could be investigated.
* Autoscaling - Base config is 1 master and 1 core node. Can scale up to 4 core nodes (depending on workload). Need to specify the autoscaling policy against the CoreNodesGroup in the EMR cluster creation
* ClusterConfiguration - Need to specify the required hadoop level config (e.g. hive.metastore.client.factory.class = com.amazonaws.glue.catalog.metastore.AWSGlueDataCatalogHiveClientFactory to connect to GDC)
* *VPC - Should create a VPC specific for the EMR instance to secure access and make it multi-AZ for redundancy

**function-check-emr-status**
* Store environment variables (EMR cluster name)
* Handle if multiple EMR environments are "Waiting" if so we need to terminate all but 1 and then continue with that one.
* Handle paging of "ListClusters" call as this has a max of 50 so would need to page all that match and get the first one (if more than one matches the statuses)

**drdb-state-machine**
* Need to add error handling to the step functions (so it would write out to the DynamoDB table and create a job against the table/database the job is being executed against).  These are process errors.
* Need to complete the development of the process (I've done a sample in here but it's not complete.  See confluence for more info of what it needs to look like).
* Use existing Step Function task definitions and fall back to Lambda if needed (e.g. addStep.sync to create a spark job and wait for it to complete - https://docs.aws.amazon.com/step-functions/latest/dg/connect-emr.html)

## References
* https://github.com/aws-samples/amazon-kinesis-analytics-beam-taxi-consumer/blob/master/cdk/lib/emr-infrastructure.ts
* https://github.com/aws-samples/aws-cdk-examples/blob/master/python/emr/app.py
* https://github.com/sebsto/cdk-vpc-example/blob/master/bin/vpc-ingress-routing.ts
* https://github.com/aws-samples/aws-cdk-examples