client = boto3.client('rekognition')


def get_session_results(session_id):
    response = client.get_face_liveness_session_results(SessionId=session_id)

    confidence = response.get("Confidence")
    status = response.get("Status")


    print('Confidence:' + "{:.2f}".format(confidence) + "%")
    print('Status:' + status)

    return status



