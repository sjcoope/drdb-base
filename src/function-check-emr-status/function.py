import sys
import traceback
import boto3
import logging
import json

# Setup logging for lambda and local development
logger = logging.getLogger()
if len(logging.getLogger().handlers) > 0:
    logging.getLogger().setLevel(logging.INFO)
else:
    logging.basicConfig(level=logging.INFO)

def handler(event, context):

    try: 
        logger.info(f"Starting EMR check status operation")
        client = boto3.client("emr")
        cluster_name = "DRDB-Job-Processor"

        # TODO: Fix paging of this (returns max of 50) and we need to accomodate that.
        clusters = client.list_clusters(
            ClusterStates=["RUNNING", "WAITING", "STARTING", "BOOTSTRAPPING"]
        )
        logger.info(f"Active Clusters Found: {len(clusters['Clusters'])}")

        matched_clusters = [i for i in clusters["Clusters"] if i["Name"] == cluster_name]
        logger.info(f"Matched Clusters Found: {len(matched_clusters)}")

        cluster_id = ""
        cluster_status = ""

        if(len(matched_clusters) > 1): 
            logger.warn(f"Number of active clusters is {len(matched_clusters)} when it should be 1")
    
        # Get first cluster from list
        if(len(matched_clusters) == 1):
            cluster = matched_clusters[0]
            cluster_id = cluster["Id"]
            cluster_status = cluster["Status"]["State"]

        return {
            "Id": cluster_id,
            "Status": cluster_status
        }

    except Exception as exp:
        exception_type, exception_value, exception_traceback = sys.exc_info()
        traceback_string = traceback.format_exception(exception_type, exception_value, exception_traceback)
        err_msg = json.dumps({
            "errorType": exception_type.__name__,
            "errorMessage": str(exception_value),
            "stackTrace": traceback_string
        })
        logger.error(err_msg)

if __name__ == '__main__':
    handler(None, None)