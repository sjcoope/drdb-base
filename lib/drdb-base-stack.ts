import * as cdk from '@aws-cdk/core';
import { DRDBDdbStateTable } from './drdb-ddb-state-table';
import { DRDBEMRCluster } from './drdb-emr-cluster';
import { DRDBStateMachine } from './drdb-state-machine';

export class DRDBBaseStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new DRDBEMRCluster(this, "DRDBProcessingEMRCluster")

    new DRDBStateMachine(this, "DRDBProcessingStateMachine");
    
    new DRDBDdbStateTable(this, "DRDBProcessingDDBStateTable")
  }
}
