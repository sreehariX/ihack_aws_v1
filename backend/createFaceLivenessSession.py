

client = boto3.client('rekognition')


def create_session(){
    response = client.create_face_liveness_session()
    session_id = response.get("SessionId")
    print('SessionId:' + session_id)


    return session_id
}


def lambda_handler(event, context):

    return {
        'statusCode': 200,
        'sessionId': create_session()
    }


