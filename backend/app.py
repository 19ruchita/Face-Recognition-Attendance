from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
import cv2
import numpy as np
import face_recognition
import os
from datetime import datetime
from flask import send_file

app = Flask(__name__)
CORS(app)

# Add base directory path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TRAINING_IMAGES_DIR = os.path.join(BASE_DIR, 'Training_images')
ATTENDANCE_FILE = os.path.join(BASE_DIR, 'Attendance.csv')

def findEncodings(images):
    encodeList = []
    for img in images:
        try:
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            faces = face_recognition.face_locations(img)
            if faces:
                encode = face_recognition.face_encodings(img, faces)[0]
                encodeList.append(encode)
        except Exception as e:
            print(f"Error encoding image: {str(e)}")
            continue
    return encodeList

import base64
import re

@app.route('/face_recognition', methods=['POST'])
def start_face_recognition():
    try:
        data = request.get_json()
        base64_image = data.get('image')

        if not base64_image:
            return jsonify({"message": "No image data provided"}), 400

        # Remove header (e.g., "data:image/jpeg;base64,")
        base64_image = re.sub('^data:image/.+;base64,', '', base64_image)
        image_data = base64.b64decode(base64_image)
        np_arr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if img is None:
            return jsonify({"message": "Image decoding failed"}), 400

        # Load training data
        if not os.path.exists(TRAINING_IMAGES_DIR):
            return jsonify({"message": "Training_images directory not found"}), 404

        myList = os.listdir(TRAINING_IMAGES_DIR)
        if not myList:
            return jsonify({"message": "No training images found"}), 404

        images = []
        classNames = []

        for cl in myList:
            if cl.lower().endswith(('.png', '.jpg', '.jpeg')):
                img_path = os.path.join(TRAINING_IMAGES_DIR, cl)
                curImg = cv2.imread(img_path)
                if curImg is not None:
                    images.append(curImg)
                    classNames.append(os.path.splitext(cl)[0])

        encodeListKnown = findEncodings(images)

        imgS = cv2.resize(img, (0, 0), fx=0.25, fy=0.25)
        imgS = cv2.cvtColor(imgS, cv2.COLOR_BGR2RGB)
        facesCurFrame = face_recognition.face_locations(imgS)

        if not facesCurFrame:
            return jsonify({"message": "No face detected"}), 400

        encodesCurFrame = face_recognition.face_encodings(imgS, facesCurFrame)

        best_match = None
        best_match_distance = float('inf')

        for encodeFace in encodesCurFrame:
            matches = face_recognition.compare_faces(encodeListKnown, encodeFace)
            faceDis = face_recognition.face_distance(encodeListKnown, encodeFace)

            if len(faceDis) > 0:
                matchIndex = np.argmin(faceDis)
                if matches[matchIndex] and faceDis[matchIndex] < best_match_distance:
                    best_match = matchIndex
                    best_match_distance = faceDis[matchIndex]

        if best_match is not None:
            name = classNames[best_match].upper()
            already_marked = markAttendance(name)

            training_image_path = os.path.join(TRAINING_IMAGES_DIR, myList[best_match])
            return jsonify({
                "message": "Attendance marked successfully" if not already_marked else "Attendance already marked",
                "name": name,
                "alreadyMarked": already_marked,
                "imagePath": training_image_path,
                "confidence": float(1 - best_match_distance)
            })

        return jsonify({"message": "No matching face found"}), 400

    except Exception as e:
        return jsonify({"message": f"Error: {str(e)}"}), 500
def markAttendance(name):
    from datetime import datetime
    marked = False
    now = datetime.now()
    dtString = now.strftime('%H:%M:%S')
    dateString = now.strftime('%Y-%m-%d')

    # Check if attendance already marked
    if os.path.exists(ATTENDANCE_FILE):
        with open(ATTENDANCE_FILE, 'r+') as f:
            lines = f.readlines()
            for line in lines:
                entry = line.strip().split(',')
                if len(entry) >= 3 and entry[0] == name and entry[2] == dateString:
                    marked = True
                    break
            if not marked:
                f.write(f'\n{name},{dtString},{dateString}')
    else:
        with open(ATTENDANCE_FILE, 'w') as f:
            f.write("Name,Time,Date\n")
            f.write(f'\n{name},{dtString},{dateString}')
    
    return marked


@app.route('/get_image')
def get_image():
    image_path = request.args.get('path')
    return send_file(image_path, mimetype='image/jpeg')

@app.route('/')
def home():
    return jsonify({"message": ""})

@app.route('/test-connection')
def test_connection():
    return jsonify({"status": "connected"})

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
