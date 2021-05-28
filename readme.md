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



* S3 Events - Connect DRFS drive s3 bucket to lambda for S3 events to trigger lambda and step functions.
* EMR Cluster - create EMR cluster with auto scaling and required resources to stop/start cluster at given (configurable) time.
* Step Functions
-- Check EMR cluster status


## Jobs to be done

**General**
* EMR Monitor - need to create a job that terminates and creates a new EMR cluster on a certain schedule. 

**drdb-emr-cluster.ts**
* Instance - EBS Config - Should be specific on the ebs config for the instances. 
* EC2 KeyPair - should be a way to specify this in the CDK but at present there isn't because you need to download any newly create KP. Other ways to store in SecretsManager after creation could be investigated.
* Autoscaling - Do we need to have a default core node to enable it to scale?  Can add autoscaling policy to instance group in cluster config.
* ClusterConfiguraiton - Need to specify the required hadoop level config (e.g. hive.metastore.client.factory.class = com.amazonaws.glue.catalog.metastore.AWSGlueDataCatalogHiveClientFactory to connect to GDC)
* *VPC - Should create a VPC specific for the EMR instance to secure access and make it multi-AZ for redundancy

**function-check-emr-status**
* Environment variables (EMR cluster name)
* Handle if multiple EMR environments are "Waiting" if so we need to terminate all but 1 and then continue with that one.
* Handle cases with EMR cluster is in state of "STARTING" - wait for it to start; "BOOTSTRAPPING" - wait for it to complete; "RUNNING" - carry on and just run the job; 
* Handle paging of "ListClusters" call as this has a max of 50 so would need to page all that match and get the first one (if more than one matches the statuses)

## References
* https://github.com/aws-samples/amazon-kinesis-analytics-beam-taxi-consumer/blob/master/cdk/lib/emr-infrastructure.ts
* https://github.com/aws-samples/aws-cdk-examples/blob/master/python/emr/app.py
* https://github.com/sebsto/cdk-vpc-example/blob/master/bin/vpc-ingress-routing.ts
* https://github.com/aws-samples/aws-cdk-examples